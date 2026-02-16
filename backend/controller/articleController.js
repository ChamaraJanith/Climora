const Article = require('../models/Article');
const axios = require('axios');

//get all articles
exports.getAllArticles = async (req, res) => {
    try{
        const { category, search } = req.query;
        let filter = { isPublished: true };

        if(category){
            filter.category = category;
        }
        if(search){
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
            ];
        }

        const articles = await Article.find(filter).sort({ publishedDate: -1 }).lean();
        res.json(articles);
    }catch(error){
        console.error('Error fetching articles:', error.message);
        res.status(500).json({ error: 'Failed to fetch articles' });
    }
};

//get article by id
exports.getArticleById = async (req, res) => {
    try{
        const article = await Article.findById(req.params.id).lean();
        if(!article){
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(article);
    }catch(error){
        console.error('Error fetching article:', error.message);
        res.status(400).json({ error: 'Invalid article ID' });
    }
};

//create new article(Admin)
exports.createArticle = async (req, res) => {
    try{
        const article = await Article.create(req.body);
        res.status(201).json(article);
    }catch(error){
        console.error('Error creating article:', error.message);
        res.status(400).json({ error: 'Failed to create article', details: error.message});
    }
};

//update article
exports.updateArticle = async (req, res) => {
    try{
        const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).lean();
        if(!article){
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(article);
    }catch(error){
        console.error('Error updating article:', error.message);
        res.status(400).json({ error: 'Failed to update article', details: error.message });
    }
};

//delete article
exports.deleteArticle = async (req, res) => {
    try{
        const article = await Article.findByIdAndDelete(req.params.id).lean();
        if(!article){
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json({ message: 'Article deleted successfully' });
    }catch(error){
        console.error('Error deleting article:', error.message);
        res.status(400).json({ error: 'Failed to delete article', details: error.message });
    }
};

//Get YouTube videos(Third-party API)
exports.getYouTubeVideos = async (req, res) => {
    try{
        const { query = "climate disaster preparedness", maxResults = 10 } = req.query;
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        if(!YOUTUBE_API_KEY){
            return res.status(500).json({ error: 'YouTube API key not configured' });
        }

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults : maxResults,
                key: YOUTUBE_API_KEY,
            },
        });

        const videos = response.data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle,
        }));

        res.json(videos);
    }catch(error){
        console.error('Error fetching YouTube videos:', error.message);
        res.status(500).json({ error: 'Failed to fetch YouTube videos', details: error.message });
    }
};
    