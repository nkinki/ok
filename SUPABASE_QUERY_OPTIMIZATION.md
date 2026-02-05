# Supabase Query Optimization Strategy

## Current Egress Problem
- **9,781 GB / 5 GB (196%)** - Almost double the free tier limit
- Main cause: Large image data being transferred repeatedly

## Immediate Optimizations

### 1. Image Data Separation
```sql
-- Create separate table for image data
CREATE TABLE exercise_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL,
  image_data TEXT NOT NULL, -- Base64 image
  compressed_data TEXT, -- Compressed version
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_exercise_images_exercise_id ON exercise_images(exercise_id);
```

### 2. Lazy Loading Strategy
```javascript
// Only load image data when needed
const loadExerciseWithImage = async (exerciseId) => {
  // First load exercise metadata (small)
  const { data: exercise } = await supabase
    .from('exercises')
    .select('id, title, instruction, type, content')
    .eq('id', exerciseId)
    .single();
    
  // Then load image separately if needed
  const { data: imageData } = await supabase
    .from('exercise_images')
    .select('compressed_data')
    .eq('exercise_id', exerciseId)
    .single();
    
  return { ...exercise, imageUrl: imageData?.compressed_data };
};
```

### 3. Batch Operations
```javascript
// Load multiple exercises efficiently
const loadExerciseBatch = async (exerciseIds) => {
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .in('id', exerciseIds);
    
  const { data: images } = await supabase
    .from('exercise_images')
    .select('exercise_id, compressed_data')
    .in('exercise_id', exerciseIds);
    
  // Combine data client-side
  return exercises.map(ex => ({
    ...ex,
    imageUrl: images.find(img => img.exercise_id === ex.id)?.compressed_data
  }));
};
```

### 4. Response Compression
```javascript
// Compress API responses
import { gzip } from 'zlib';

export default async function handler(req, res) {
  const data = await getSessionData(sessionCode);
  
  // Compress large responses
  if (JSON.stringify(data).length > 100000) {
    const compressed = await gzipCompress(JSON.stringify(data));
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Content-Type', 'application/json');
    return res.send(compressed);
  }
  
  return res.json(data);
}
```

### 5. Selective Field Loading
```javascript
// Only load needed fields
const getSessionSummary = async (sessionCode) => {
  return await supabase
    .from('teacher_sessions')
    .select('session_code, subject, class_name, created_at, exercise_count')
    .eq('session_code', sessionCode)
    .single();
};

const getSessionDetails = async (sessionCode) => {
  return await supabase
    .from('teacher_sessions')
    .select('*')
    .eq('session_code', sessionCode)
    .single();
};
```

## Implementation Priority

### Phase 1 (Immediate - 50% reduction)
1. ✅ Aggressive image compression (implemented)
2. ✅ Client-side image caching (implemented)
3. 🔄 Selective field loading in API
4. 🔄 Response compression for large payloads

### Phase 2 (Short term - 70% reduction)
1. 🔄 Separate image storage table
2. 🔄 Lazy loading implementation
3. 🔄 Batch operations optimization
4. 🔄 CDN integration for images

### Phase 3 (Long term - 90% reduction)
1. 🔄 External image storage (Google Drive/Cloudinary)
2. 🔄 Delta sync for session updates
3. 🔄 Progressive image loading
4. 🔄 Edge caching strategy

## Monitoring & Alerts
```javascript
// Track egress usage
const trackEgressUsage = async (operation, dataSize) => {
  console.log(`📊 Egress: ${operation} - ${Math.round(dataSize/1024)}KB`);
  
  // Store in local analytics
  const usage = JSON.parse(localStorage.getItem('egress_usage') || '{}');
  usage[operation] = (usage[operation] || 0) + dataSize;
  localStorage.setItem('egress_usage', JSON.stringify(usage));
};
```

## Expected Results
- **Phase 1**: 9.7GB → 4.8GB (50% reduction)
- **Phase 2**: 4.8GB → 2.9GB (70% total reduction)  
- **Phase 3**: 2.9GB → 1.0GB (90% total reduction)

This should bring usage well under the 5GB free tier limit.