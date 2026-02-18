const Article = require('../models/Article');
const Quiz = require('../models/Quiz');
const axios = require('axios');

// GET /api/articles - Get all articles
exports.getAllArticles = async (req, res) => {
    try {
        const { category, search, limit = 20, page = 1 } = req.query;
        
        // Build filter object
        let filter = { isPublished: true };

        // Filter by category if provided
        if (category && category !== 'all') {
            filter.category = category;
        }

        // Text search in title and content if search term provided
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query with pagination
        const articles = await Article.find(filter)
            .sort({ publishedDate: -1 }) // Sort by newest first
            .limit(parseInt(limit))
            .skip(skip)
            .lean();

        // Get total count for pagination info
        const total = await Article.countDocuments(filter);

        res.json({
            articles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching articles:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch articles',
            details: error.message,
        });
    }
};

// GET /api/articles/:id - Get single article WITH quiz AND related YouTube videos
exports.getArticleById = async (req, res) => {
    try {
        // Fetch the article
        const article = await Article.findById(req.params.id).lean();
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Fetch the linked quiz if it exists
        let quiz = null;
        if (article.quizId) {
            quiz = await Quiz.findById(article.quizId).lean();
        }

        // ✅ Fetch related YouTube videos based on article category
        let relatedVideos = [];
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        
        if (YOUTUBE_API_KEY) {
            try {
                // Build search query based on article category
                const searchQuery = `${article.category} disaster preparedness safety Sri Lanka`;
                
                const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                    params: {
                        part: 'snippet',
                        q: searchQuery,
                        type: 'video',
                        maxResults: 5,
                        order: 'relevance', // Most relevant videos first
                        key: YOUTUBE_API_KEY,
                        relevanceLanguage: 'en', // Prefer English content
                    },
                });

                // Map YouTube response to simplified format
                relatedVideos = response.data.items.map((item) => ({
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    publishedAt: item.snippet.publishedAt,
                    channelTitle: item.snippet.channelTitle,
                    videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                }));

                console.log(`✅ Fetched ${relatedVideos.length} related videos for article: ${article.title}`);
            } catch (error) {
                console.error('Error fetching related YouTube videos:', error.message);
                // Don't fail the request if YouTube API fails, just log it
            }
        } else {
            console.warn('⚠️ YouTube API key not configured, skipping related videos');
        }

        // Return article with quiz and related videos
        res.json({
            ...article,
            quiz: quiz || null, // Include quiz if it exists
            relatedVideos, // Include related YouTube videos
            hasQuiz: !!quiz, // Boolean flag for frontend convenience
            hasRelatedVideos: relatedVideos.length > 0,
        });
    } catch (error) {
        console.error('Error fetching article:', error.message);
        res.status(400).json({ 
            error: 'Invalid article ID',
            details: error.message,
        });
    }
};

// POST /api/articles - Create new article (Admin)
exports.createArticle = async (req, res) => {
    try {
        const { title, content, category, author, imageUrl } = req.body;

        // Validation
        if (!title || !content || !author) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['title', 'content', 'author'],
            });
        }

        // Create article
        const article = await Article.create({
            title,
            content,
            category,
            author,
            imageUrl,
        });

        console.log(`✅ Article created: ${article._id} - ${article.title}`);
        res.status(201).json(article);
    } catch (error) {
        console.error('Error creating article:', error.message);
        res.status(400).json({ 
            error: 'Failed to create article', 
            details: error.message,
        });
    }
};

// PUT /api/articles/:id - Update article (Admin)
exports.updateArticle = async (req, res) => {
    try {
        // Don't allow updating quizId directly (should be done through quiz operations)
        const { quizId, ...updateData } = req.body;

        const article = await Article.findByIdAndUpdate(
            req.params.id,
            updateData,
            { 
                new: true, // Return updated document
                runValidators: true, // Run schema validators
            }
        ).lean();

        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        console.log(`✅ Article updated: ${article._id}`);
        res.json(article);
    } catch (error) {
        console.error('Error updating article:', error.message);
        res.status(400).json({ 
            error: 'Failed to update article', 
            details: error.message,
        });
    }
};


// DELETE /api/articles/:id - Delete article and its quiz
exports.deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // If article has a quiz, delete it first (cascade delete)
        if (article.quizId) {
            await Quiz.findByIdAndDelete(article.quizId);
            console.log(`✅ Deleted associated quiz: ${article.quizId}`);
        }

        // Delete the article
        await Article.findByIdAndDelete(req.params.id);

        console.log(`✅ Article deleted: ${req.params.id}`);
        res.json({ 
            message: 'Article and associated quiz deleted successfully',
            deletedArticleId: req.params.id,
            deletedQuizId: article.quizId || null,
        });
    } catch (error) {
        console.error('Error deleting article:', error.message);
        res.status(400).json({ 
            error: 'Failed to delete article', 
            details: error.message,
        });
    }
};


// GET /api/articles/youtube/videos - Search YouTube videos (Third-party API)
exports.getYouTubeVideos = async (req, res) => {
    try {
        const { 
            query = 'climate disaster preparedness', 
            maxResults = 10,
            order = 'relevance', // relevance, date, viewCount, rating
        } = req.query;

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        // Check if API key is configured
        if (!YOUTUBE_API_KEY) {
            return res.status(500).json({ 
                error: 'YouTube API key not configured',
                message: 'Please add YOUTUBE_API_KEY to your .env file',
            });
        }

        // Validate maxResults
        const resultsLimit = Math.min(Math.max(parseInt(maxResults), 1), 50);

        console.log(`🔍 Searching YouTube for: "${query}"`);

        // Make request to YouTube Data API
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: resultsLimit,
                order,
                key: YOUTUBE_API_KEY,
                relevanceLanguage: 'en',
                safeSearch: 'strict', // Filter inappropriate content
            },
        });

        // Transform YouTube response to simplified format
        const videos = response.data.items.map((item) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            thumbnailHigh: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
        }));

        console.log(`✅ Found ${videos.length} YouTube videos`);

        res.json({
            query,
            resultsCount: videos.length,
            videos,
        });
    } catch (error) {
        console.error('Error fetching YouTube videos:', error.message);
        
        // Handle YouTube API specific errors
        if (error.response?.status === 403) {
            return res.status(403).json({ 
                error: 'YouTube API quota exceeded or invalid API key',
                details: error.response.data,
            });
        }

        res.status(500).json({ 
            error: 'Failed to fetch YouTube videos', 
            details: error.message,
        });
    }
};

// GET /api/articles/stats - Get article statistics (Optional)
exports.getArticleStats = async (req, res) => {
    try {
        console.log('\n📊 ========== Article Statistics ==========');
        
        // Get total articles
        const total = await Article.countDocuments({ isPublished: true });
        console.log(`📄 Total Articles: ${total}`);

        // Get count by category
        const byCategory = await Article.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        console.log('\n📂 Articles by Category:');
        byCategory.forEach(cat => {
            // Add specific icons for each category
            let icon = '📌';
            if (cat._id === 'flood') icon = '🌊';
            else if (cat._id === 'drought') icon = '🌵';
            else if (cat._id === 'cyclone') icon = '🌀';
            else if (cat._id === 'landslide') icon = '⛰️';
            else if (cat._id === 'heatwave') icon = '🔥';
            else if (cat._id === 'general') icon = '📰';
            
            console.log(`  ${icon} ${cat._id}: ${cat.count}`);
        });

        // Get articles with quizzes
        const withQuiz = await Article.countDocuments({ 
            isPublished: true, 
            quizId: { $ne: null },
        });

        const withoutQuiz = total - withQuiz;
        
        console.log('\n📝 Quiz Statistics:');
        console.log(`  ✅ With Quiz: ${withQuiz}`);
        console.log(`  ❌ Without Quiz: ${withoutQuiz}`);
        
        console.log('📊 ==========================================\n');

        // Send response
        res.json({
            total,
            withQuiz,
            withoutQuiz: total - withQuiz,
            byCategory: byCategory.map(cat => ({
                category: cat._id,
                count: cat.count,
            })),
        });
    } catch (error) {
        console.error('❌ Error fetching article stats:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch statistics',
            details: error.message,
        });
    }
};