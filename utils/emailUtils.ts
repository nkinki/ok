
export const generateEmailData = (teacherEmail: string, studentName: string, studentClass: string, score: number, total: number) => {
  const subjectText = `Eredmény: ${studentName} (${studentClass}) - Napi Gyakorlás`;
  const subject = encodeURIComponent(subjectText);
  
  const date = new Date().toLocaleDateString('hu-HU');
  const percentage = Math.round((score / total) * 100);
  
  const bodyText = `
Kedves Pedagógus!

A következő tanuló elvégezte a Napi Gyakorlást az OkosGyakorló alkalmazásban.

Tanuló neve: ${studentName}
Osztály: ${studentClass}
Dátum: ${date}

----------------------------------------
EREDMÉNY: ${score} / ${total} pont
Százalék: ${percentage}%
----------------------------------------

Üdvözlettel,
OkosGyakorló App
  `.trim();

  const body = encodeURIComponent(bodyText);
  const link = `mailto:${teacherEmail}?subject=${subject}&body=${body}`;

  return {
      link,
      subject: subjectText,
      body: bodyText
  };
};
