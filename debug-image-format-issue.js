<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Format Debug</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #f5f5f5; }
        .console { background: #000; color: #0f0; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
        button { padding: 10px 20px; margin: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #005a9e; }
    </style>
</head>
<body>
    <h1>🔍 Image Format Debug Tool</h1>
    <button onclick="runDiagnosis()">Run Diagnosis</button>
    <button onclick="clearConsole()">Clear Console</button>
    
    <div id="console" class="console"></div>

    <script>
        let consoleDiv = document.getElementById('console');
        
        function log(message) {
            consoleDiv.textContent += message + '\n';
            console.log(message);
        }
        
        function clearConsole() {
            consoleDiv.textContent = '';
        }

        function runDiagnosis() {
            clearConsole();
            log('🚀 Starting image format diagnosis...\n');
            
            try {
                // Get library from localStorage
                const libraryData = localStorage.getItem('okosgyakorlo_library');
                if (!libraryData) {
                    log('❌ No library found in localStorage');
                    return;
                }
                
                const library = JSON.parse(libraryData);
                log(`📚 Found ${library.length} exercises in library`);
                
                // Check each exercise's image format
                library.forEach((exercise, index) => {
                    log(`\n📋 Exercise ${index + 1}: ${exercise.fileName || exercise.id}`);
                    
                    if (!exercise.imageUrl) {
                        log('  ❌ No imageUrl found');
                        return;
                    }
                    
                    const imageUrl = exercise.imageUrl;
                    log(`  📊 Image URL length: ${imageUrl.length} characters`);
                    
                    // Check if it's base64
                    if (imageUrl.startsWith('data:')) {
                        const mimeMatch = imageUrl.match(/^data:([^;]+);base64,/);
                        if (mimeMatch) {
                            log(`  ✅ Valid base64 format: ${mimeMatch[1]}`);
                            
                            // Check base64 data length
                            const base64Data = imageUrl.split(',')[1];
                            log(`  📏 Base64 data length: ${base64Data.length} characters`);
                            
                            // Estimate file size
                            const estimatedSize = (base64Data.length * 3) / 4;
                            log(`  💾 Estimated file size: ${Math.round(estimatedSize / 1024)} KB`);
                            
                            // Check for common issues
                            if (base64Data.length < 1000) {
                                log('  ⚠️  WARNING: Base64 data seems too short - might be corrupted');
                            }
                            
                            if (estimatedSize > 5 * 1024 * 1024) { // 5MB
                                log('  ⚠️  WARNING: Image is very large - might cause loading issues');
                            }
                            
                            // Check MIME type
                            if (mimeMatch[1] === 'image/jpeg') {
                                log('  📸 JPEG format - good for photos');
                            } else if (mimeMatch[1] === 'image/png') {
                                log('  🖼️  PNG format - good for graphics');
                            } else {
                                log(`  ❓ Unusual format: ${mimeMatch[1]}`);
                            }
                            
                        } else {
                            log('  ❌ Invalid base64 format - missing MIME type');
                        }
                    } else if (imageUrl.startsWith('http')) {
                        log('  🌐 External URL format');
                    } else {
                        log('  ❓ Unknown image format');
                        log(`  🔍 Preview: ${imageUrl.substring(0, 100)}...`);
                    }
                });
                
                // Check for potential issues
                log('\n🔍 Checking for potential issues...');
                
                const exercisesWithoutImages = library.filter(ex => !ex.imageUrl || ex.imageUrl.length < 100);
                if (exercisesWithoutImages.length > 0) {
                    log(`⚠️  ${exercisesWithoutImages.length} exercises have missing or invalid images:`);
                    exercisesWithoutImages.forEach(ex => {
                        log(`  - ${ex.fileName || ex.id}: ${ex.imageUrl ? 'too short' : 'missing'}`);
                    });
                }
                
                const largeImages = library.filter(ex => ex.imageUrl && ex.imageUrl.length > 2000000); // ~1.5MB base64
                if (largeImages.length > 0) {
                    log(`⚠️  ${largeImages.length} exercises have very large images:`);
                    largeImages.forEach(ex => {
                        const size = Math.round((ex.imageUrl.length * 3) / 4 / 1024);
                        log(`  - ${ex.fileName || ex.id}: ~${size} KB`);
                    });
                }
                
                // Test image loading
                log('\n🧪 Testing image loading...');
                const firstExercise = library[0];
                
                if (firstExercise && firstExercise.imageUrl) {
                    log('🖼️  Testing first exercise image loading...');
                    
                    const img = new Image();
                    img.onload = () => {
                        log('✅ Image loaded successfully: ' + firstExercise.fileName);
                        log(`  Size: ${img.naturalWidth}x${img.naturalHeight}px`);
                    };
                    img.onerror = (error) => {
                        log('❌ Image failed to load: ' + firstExercise.fileName);
                    };
                    
                    img.src = firstExercise.imageUrl;
                }
                
                log('\n✅ Image format diagnosis complete!');
                
            } catch (error) {
                log('❌ Error during diagnosis: ' + error.message);
            }
        }
    </script>
</body>
</html>