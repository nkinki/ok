
import React, { useState, useEffect } from 'react';
import { QuizContent } from '../types';

interface Props {
  content: QuizContent;
  onComplete: () => void;
  onNext?: () => void;
  onAnswer?: (selectedAnswers: number[], isCorrect: boolean, responseTime: number) => void;
  startTime?: Date;
}

const QuizExercise: React.FC<Props> = ({ content, onComplete, onNext, onAnswer, startTime }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // State stores selected indices: number for single, number[] for multi
  const [selectedOption, setSelectedOption] = useState<number | number[] | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [questionStartTime] = useState<Date>(startTime || new Date());

  // Safety check: Ensure questions exist
  if (!content.questions || content.questions.length === 0) {
      return <div className="text-center p-8 text-red-500 font-bold">Hiba: Nincsenek kérdések ebben a feladatban.</div>;
  }

  const currentQuestion = content.questions[currentIndex];
  
  // Safety check: Ensure current index is valid
  if (!currentQuestion) {
      return <div className="text-center p-8 text-gray-500">Betöltés...</div>;
  }

  const isMulti = currentQuestion.multiSelect || false;

  // Reset selection when question changes
  useEffect(() => {
      setSelectedOption(isMulti ? [] : null);
      setIsAnswered(false);
  }, [currentIndex, isMulti]);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;

    if (isMulti) {
        // Multi-select logic
        const currentSelection = (selectedOption as number[]) || [];
        if (currentSelection.includes(index)) {
            setSelectedOption(currentSelection.filter(i => i !== index));
        } else {
            setSelectedOption([...currentSelection, index]);
        }
    } else {
        // Single-select logic
        setSelectedOption(index);
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null || (Array.isArray(selectedOption) && selectedOption.length === 0)) return;
    
    setIsAnswered(true);
    
    let isCorrect = false;
    if (isMulti) {
        // Check if arrays match (ignoring order)
        const userSelection = (selectedOption as number[]).sort((a, b) => a - b);
        const correctSelection = (currentQuestion.correctIndices || [currentQuestion.correctIndex]).sort((a, b) => a - b);
        
        if (userSelection.length === correctSelection.length && 
            userSelection.every((val, index) => val === correctSelection[index])) {
            isCorrect = true;
        }
    } else {
        if (selectedOption === currentQuestion.correctIndex) {
            isCorrect = true;
        }
    }

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    
    // Calculate response time and call onAnswer callback
    if (onAnswer) {
      const responseTime = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
      const selectedAnswers = Array.isArray(selectedOption) ? selectedOption : [selectedOption];
      onAnswer(selectedAnswers, isCorrect, responseTime);
    }
  };

  const handleNext = () => {
    if (currentIndex < content.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
      onComplete();
    }
  };

  const progress = ((currentIndex) / content.questions.length) * 100;

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl shadow-sm">
        <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🏆</span>
        </div>
        <h3 className="text-2xl font-bold text-brand-900 mb-2">Szép munka!</h3>
        <p className="text-gray-600 mb-8">
          Sikeresen befejezted a feladatsort.<br/>
          Eredményed: <strong className="text-brand-600">{score} / {content.questions.length}</strong>
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
            <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-brand-600 border-2 border-brand-200 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-lg"
            >
            Újra
            </button>
            {onNext && (
                <button 
                    onClick={onNext} 
                    className="bg-brand-600 text-white px-8 py-3 rounded-full font-bold hover:bg-brand-700 transition-colors shadow-lg flex items-center gap-2"
                >
                    Következő feladat
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar - Compact */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
          <span>Kérdés {currentIndex + 1} / {content.questions.length}</span>
          <span>{score} pont</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-600 h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card - Compact */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-base font-bold text-gray-800 mb-2 leading-tight">
          {currentQuestion.question}
        </h3>
        {isMulti && <p className="text-xs text-brand-600 font-bold mb-3 uppercase tracking-wide">Több válasz is lehetséges</p>}

        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            let stateStyles = "border-gray-200 hover:border-brand-300 hover:bg-brand-50";
            let icon = null;
            let statusText = "";
            
            // Logic to determine if this specific option is selected by user
            const isSelectedByUser = isMulti 
                ? (selectedOption as number[])?.includes(idx) 
                : selectedOption === idx;

            // Logic to determine if this option IS correct (truth)
            const isActuallyCorrect = isMulti
                ? (currentQuestion.correctIndices || [currentQuestion.correctIndex]).includes(idx)
                : currentQuestion.correctIndex === idx;

            if (isAnswered) {
              if (isActuallyCorrect) {
                stateStyles = "border-green-500 bg-green-50 text-green-700 font-medium ring-1 ring-green-500";
                icon = <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>;
                statusText = "Helyes válasz";
              } else if (isSelectedByUser) {
                stateStyles = "border-red-500 bg-red-50 text-red-700";
                icon = <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
                statusText = "Rossz válasz";
              } else {
                stateStyles = "border-gray-100 text-gray-400 opacity-50";
              }
            } else if (isSelectedByUser) {
              stateStyles = "border-brand-500 bg-brand-50 ring-1 ring-brand-500 shadow-sm";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={isAnswered}
                className={`
                  w-full text-left p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between group text-sm
                  ${stateStyles}
                `}
              >
                <div className="flex items-center gap-2">
                    <div className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0
                        ${isMulti ? 'rounded-md' : 'rounded-full'}
                        ${isSelectedByUser 
                            ? (isAnswered ? (isActuallyCorrect ? 'border-green-600 bg-green-600' : 'border-red-500 bg-red-500') : 'border-brand-600 bg-brand-600') 
                            : 'border-gray-300 group-hover:border-brand-400'}
                    `}>
                        {isSelectedByUser && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <span className="leading-tight">{option}</span>
                        {isAnswered && statusText && (
                            <div className="text-xs font-medium mt-1 opacity-75">
                                {statusText}
                            </div>
                        )}
                    </div>
                </div>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions - Compact */}
      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || (Array.isArray(selectedOption) && selectedOption.length === 0)}
            className={`
              px-6 py-2 rounded-lg font-bold text-white shadow transition-all text-sm
              ${(selectedOption !== null && (!Array.isArray(selectedOption) || selectedOption.length > 0)) ? 'bg-brand-600 hover:bg-brand-700' : 'bg-gray-300 cursor-not-allowed'}
            `}
          >
            Ellenőrzés
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-all flex items-center gap-2 text-sm"
          >
            {currentIndex === content.questions.length - 1 ? "Befejezés" : "Következő"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizExercise;
