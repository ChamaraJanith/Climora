const axios = require('axios');
const ClimateNews = require('../models/ClimateNews');

// BLACKLIST: If title OR description matches any of these,
// article is immediately rejected as NOT climate news.
// Catches sports teams, metaphors, politics, lifestyle etc.
const BLACKLIST_PATTERNS = [
    // Sports teams named after weather/disasters
    /iowa\s+state\s+cyclones?/i,
    /cyclones?\s+(basketball|football|soccer|team|game|match|vs\.?|beat|wins?|loses?|score|rally|fans?)/i,
    /\bstorm[s]?\s+(team|game|nba|nhl|match|beat|wins?|loses?|score|rally|fans?)/i,
    /\bheat\s+(game|team|nba|match|miami\s+heat)/i,
    /\bthunder\s+(game|team|nba|okc|match|oklahoma)/i,
    /\bavalanche[s]?\s+(game|team|nhl|match|beat|wins?|loses?)/i,
    /\btornado[es]?\s+(game|team|match|beat|wins?)/i,

    // Sports events / golf / tennis / racing
    /pga\s+tour|genesis\s+invitational|masters\s+tournament/i,
    /\bgolf\b.*(tournament|round|birdie|eagle|par\s+\d)/i,
    /\btennis\b.*(match|set|wimbledon|open|tournament)/i,
    /nascar|formula\s+1|\bf1\s+race\b|grand\s+prix/i,
    /\bwrestl(ing|er)\b|\bmma\b|\bufc\b/i,

    // Metaphorical usage of climate words
    /stormed\s+(through|into|out\s+of)\s+the/i,
    /golden\s+drought/i,
    /drought\s+of\s+(wins?|goals?|points?|titles?|success|medals?|trophies)/i,
    /end(ed|ing|s)?\s+.{0,30}drought/i,                // "ended their 10-year drought"
    /political\s+(storm|firestorm|cyclone)/i,
    /firestorm\s+of\s+(criticism|controversy|debate|backlash)/i,
    /\bbrainstorm\b/i,

    // Business / Finance / Tech
    /stock\s+market|cryptocurrency|bitcoin|\bipo\b|investment\s+summit/i,
    /\bmsme\b|\bsme\s+financing\b|\bprivate\s+capital\b/i,
    /\bai\s+(summit|buildout|impact\s+summit|spending|data\s+center)\b/i,
    /\bchatgpt\b|\bllm\b|\bgenerative\s+ai\b/i,

    // Politics / Governance (non-disaster)
    /\belection\b|\bparliament\b|\bsenate\s+bill\b|\bcongress\s+vote\b/i,
    /\bscathing\s+attack\b|\bpolitical\s+party\b|\bcorruption\s+allegation\b/i,

    // Food / Lifestyle / Entertainment
    /recipe[s]?|cooking|culinary|restaurant\s+review/i,
    /fashion\s+week|lifestyle|celebrity\s+news/i,

    // Podcast / Interview unrelated to climate
    /\bpodcast\b.*\bceo\b|\bceo\b.*\bpodcast\b/i,
    /\banthropicb.*\bpodcast\b/i,
];


// CLIMATE PATTERNS: Title must match one of these to be saved.
// Ordered by specificity - more specific patterns first.
const CLIMATE_TITLE_PATTERNS = [
    // Flood - specific water/flooding terms
    { regex: /\bflash\s+flood|\bflood(ing|s|waters?|ed|warning|watch|alert|risk|threat|plain|prone)\b|\binundation\b|\bsubmerged.*water|river\s+(overflow|burst|level)/i, category: 'flood' },

    // Cyclone - must be meteorological, not a sports team
    { regex: /\btropical\s+(cyclone|storm|depression)|\bhurricane\b|\btyphoon\b|\bbomb\s+cyclone\b|\bcyclone\s+[A-Z][a-z]+\b/i, category: 'cyclone' },

    // Landslide / Mudslide
    { regex: /\blandslide\s+(risk|warning|threat|hit|kills?|kills?\s+\d|victims?|evacuate)|\bmudslide\b|\brockslide\b|\bmudflow\b|\blandslip\b/i, category: 'landslide' },

    // Wildfire - must say wildfire/forest fire explicitly
    { regex: /\bwildfire[s]?\b|\bforest\s+fire[s]?\b|\bbush\s+fire[s]?\b|\bbushfire[s]?\b|\bwildland\s+fire\b/i, category: 'wildfire' },

    // Tsunami
    { regex: /\btsunami\b|\btidal\s+wave\b/i, category: 'tsunami' },

    // Earthquake - must have magnitude or quake/tremor in weather context
    { regex: /\bearthquake[s]?\b|\b\d+(\.\d+)?\s*[-–]?\s*magnitude\b|\bmagnitude\s+\d+(\.\d+)?\b|\bseismic\s+(event|activity|wave)|\btremors?\s+(felt|reported|hit|strikes?)\b/i, category: 'earthquake' },

    // Drought - only meteorological, not sports metaphor
    { regex: /\b(severe|prolonged|extreme|record|ongoing|water)\s+drought\b|\bdrought\s+(conditions?|warning|declared|emergency|hit|affects?|crisis)\b|\bwater\s+(shortage|scarcity|crisis|deficit)\b/i, category: 'drought' },

    // Storm - only actual weather events, not metaphors
    { regex: /\b(winter\s+storm|snowstorm|blizzard|nor'?easter|thunderstorm|tornado\s+(hits?|warning|watch|touches?)|hailstorm|cyclonic\s+storm|storm\s+warning|storm\s+surge|storm\s+hits?|severe\s+weather|heavy\s+rain(fall)?|heavy\s+snow(fall)?|strong\s+winds?\s+(hit|batter|lash)|gale[-\s]force\s+winds?)\b/i, category: 'storm' },

    // Avalanche - only natural disaster context
    { regex: /\bavalanche\s+(kills?|deaths?|warning|risk|hit|buried|victims?|swept)\b|\bdeadly\s+avalanche\b/i, category: 'landslide' },
];

// ============================================================
// HELPER: Detect climate category with strict title-first logic
// Returns null if article is NOT genuinely climate related
const detectClimateCategory = (title = '', description = '') => {
    // Step 1: Check blacklist - instant rejection
    for (const pattern of BLACKLIST_PATTERNS) {
        if (pattern.test(title)) {
            return null; // Blacklisted by title
        }
        // Also check description for blacklist (catches misleading titles)
        if (pattern.test(description)) {
            return null;
        }
    }

    // Step 2: Title must match a strict climate pattern
    for (const { regex, category } of CLIMATE_TITLE_PATTERNS) {
        if (regex.test(title)) {
            return category;
        }
    }

    // Step 3: If title has strong disaster context words, check description too
    const strongDisasterTitle = /\b(disaster|emergency|evacuation|evacuated|casualties|rescue\s+operation|relief\s+effort|death\s+toll|people\s+killed|people\s+dead|homes?\s+destroyed|damage\s+assessment)\b/i.test(title);

    if (strongDisasterTitle) {
        for (const { regex, category } of CLIMATE_TITLE_PATTERNS) {
            if (regex.test(description)) {
                return category;
            }
        }
    }

    return null; // Not a climate article
};


// HELPER: Determine if article is genuinely Sri Lanka specific
// Rejects articles that list 5+ countries (syndicated world news)
const isActuallySriLanka = (item, queriedWithSriLanka) => {
    const countryRaw = item.country || '';
    const countryList = Array.isArray(countryRaw)
        ? countryRaw.map(c => c.toLowerCase().trim())
        : countryRaw.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);

    // Articles with 5+ countries = syndicated world feed, not SL specific
    if (countryList.length > 4) return false;

    const hasSriLanka = countryList.some(c => c.includes('sri lanka'));

    // Queried with country:'lk' + short list = genuine SL article
    if (queriedWithSriLanka && countryList.length <= 4) return true;

    return hasSriLanka;
};


// HELPER: Single keyword API call (NewsData.io free plan)
// Free plan does NOT support OR operators in query strings
const fetchByKeyword = async (apiKey, keyword, country = null) => {
    const params = {
        apikey: apiKey,
        language: 'en',
        q: keyword,
        size: 5,
    };
    if (country) params.country = country;

    const response = await axios.get('https://newsdata.io/api/1/news', { params });
    return response.data?.results || [];
};

// CORE: Fetch from NewsData.io API and save strictly filtered
// results to MongoDB cache
const fetchAndCacheNews = async () => {
    const API_KEY = process.env.NEWSDATA_API_KEY;
    if (!API_KEY) throw new Error('NEWSDATA_API_KEY not configured in .env file');

    const sriLankaKeywords = ['flood', 'cyclone', 'earthquake', 'tsunami', 'wildfire', 'drought', 'landslide'];
    const worldKeywords    = ['flood', 'cyclone', 'earthquake', 'tsunami', 'wildfire'];

    const allFetched = [];

    // Fetch Sri Lanka news - silent
    for (const keyword of sriLankaKeywords) {
        try {
            const results = await fetchByKeyword(API_KEY, keyword, 'lk');
            results.forEach(item => allFetched.push({ ...item, _queriedAsSriLanka: true }));
            await new Promise(r => setTimeout(r, 400));
        } catch (err) {
            console.warn(`⚠️ LK [${keyword}] failed: ${err.message}`);
        }
    }

    // Fetch world news - silent
    for (const keyword of worldKeywords) {
        try {
            const results = await fetchByKeyword(API_KEY, keyword);
            results.forEach(item => allFetched.push({ ...item, _queriedAsSriLanka: false }));
            await new Promise(r => setTimeout(r, 400));
        } catch (err) {
            console.warn(`⚠️ World [${keyword}] failed: ${err.message}`);
        }
    }

    let savedCount = 0;
    let skippedNotClimate = 0;
    let skippedDuplicate = 0;

    for (const item of allFetched) {
        try {
            const exists = await ClimateNews.findOne({ articleId: item.article_id });
            if (exists) { skippedDuplicate++; continue; }

            const climateCategory = detectClimateCategory(item.title || '', item.description || '');

            if (!climateCategory) {
                skippedNotClimate++;
                continue; // No log
            }

            const sriLankaSpecific = isActuallySriLanka(item, item._queriedAsSriLanka);

            await ClimateNews.create({
                articleId:    item.article_id,
                title:        item.title || 'No title',
                description:  item.description || '',
                content:      item.content || '',
                sourceName:   item.source_id || '',
                sourceUrl:    item.source_url || '',
                link:         item.link,
                imageUrl:     item.image_url || null,
                publishedAt:  new Date(item.pubDate),
                country:      Array.isArray(item.country) ? item.country.join(',') : (item.country || ''),
                climateCategory,
                isSriLanka:   sriLankaSpecific,
            });

            savedCount++;
        } catch (err) {
            if (err.code !== 11000) console.error(`⚠️ Save error: ${err.message}`);
        }
    }

    // Single clean summary line only
    console.log(`🌦️  Climate News → Fetched: ${allFetched.length} | Saved: ${savedCount} | Rejected: ${skippedNotClimate} | Duplicates: ${skippedDuplicate}`);

    return savedCount;
};

// GET /api/climate-news
// Query: category, type (sri-lanka|world|all), page, limit, refresh
exports.getClimateNews = async (req, res) => {
    try {
        const { category = 'all', type = 'all', page = 1, limit = 12, refresh = 'false' } = req.query;

        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        const latestCached = await ClimateNews.findOne().sort({ createdAt: -1 }).lean();
        const isCacheStale = !latestCached || latestCached.createdAt < thirtyMinutesAgo;

        if (isCacheStale || refresh === 'true') {
            console.log('🔄 Refreshing from API...');
            try {
                await fetchAndCacheNews();
            } catch (err) {
                if (!latestCached) {
                    return res.status(503).json({ error: 'News API unavailable and no cached data', details: err.message });
                }
                console.warn('⚠️ API failed - serving from cache');
            }
        }

        const filter = {};
        if (category !== 'all') filter.climateCategory = category;
        if (type === 'sri-lanka') filter.isSriLanka = true;
        else if (type === 'world') filter.isSriLanka = false;

        const skip  = (parseInt(page) - 1) * parseInt(limit);
        const total = await ClimateNews.countDocuments(filter);
        const news  = await ClimateNews.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

        res.json({
            news,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
            meta: { type, category, lastUpdated: latestCached?.createdAt || null },
        });
    } catch (err) {
        console.error('❌ getClimateNews:', err.message);
        res.status(500).json({ error: 'Failed to fetch climate news', details: err.message });
    }
};


// GET /api/climate-news/latest - Latest 6 for homepage widget
exports.getLatestClimateNews = async (req, res) => {
    try {
        const news = await ClimateNews.find().sort({ publishedAt: -1 }).limit(6).lean();
        res.json({ news, total: news.length });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest news' });
    }
};


// GET /api/climate-news/stats - Category + region breakdown
exports.getClimateNewsStats = async (req, res) => {
    try {
        const byCategory    = await ClimateNews.aggregate([{ $group: { _id: '$climateCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
        const sriLankaCount = await ClimateNews.countDocuments({ isSriLanka: true });
        const worldCount    = await ClimateNews.countDocuments({ isSriLanka: false });
        const total         = await ClimateNews.countDocuments();

        res.json({
            total, sriLanka: sriLankaCount, world: worldCount,
            byCategory: byCategory.map(c => ({ category: c._id, count: c.count })),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

// POST /api/climate-news/refresh (Admin only) - Force API fetch
exports.manualRefresh = async (req, res) => {
    try {
        const savedCount = await fetchAndCacheNews();
        res.json({ message: 'Refreshed successfully', newArticlesSaved: savedCount });
    } catch (err) {
        res.status(500).json({ error: 'Refresh failed', details: err.message });
    }
};


// DELETE /api/climate-news/cleanup (Admin only)
// Re-evaluates ALL existing articles with the new strict filter.
// Deletes irrelevant ones, fixes wrong category/isSriLanka flags.
// Run ONCE after deploying this updated controller.
exports.cleanupIrrelevantNews = async (req, res) => {
    try {
        console.log('🧹 Starting DB cleanup with strict filter...');

        const allArticles = await ClimateNews.find().lean();
        let deletedCount  = 0;
        let fixedCount    = 0;

        for (const article of allArticles) {
            const climateCategory = detectClimateCategory(article.title, article.description);

            // Delete if it fails the strict filter
            if (!climateCategory) {
                await ClimateNews.deleteOne({ _id: article._id });
                deletedCount++;
                console.log(`  🗑️ Deleted: "${article.title.slice(0, 65)}"`);
                continue;
            }

            // Fix isSriLanka - re-evaluate country list length
            const countryList = (article.country || '').split(',').map(c => c.trim()).filter(Boolean);
            const correctSriLanka = countryList.length <= 4 && countryList.some(c => c.toLowerCase().includes('sri lanka'));

            // Update if category or flag changed
            if (article.climateCategory !== climateCategory || article.isSriLanka !== correctSriLanka) {
                await ClimateNews.updateOne({ _id: article._id }, { $set: { climateCategory, isSriLanka: correctSriLanka } });
                fixedCount++;
            }
        }

        const remaining = await ClimateNews.countDocuments();
        console.log(`✅ Cleanup done: ${deletedCount} deleted, ${fixedCount} fixed, ${remaining} remaining`);

        res.json({ message: 'Cleanup done', deletedIrrelevant: deletedCount, fixed: fixedCount, remaining });
    } catch (err) {
        res.status(500).json({ error: 'Cleanup failed', details: err.message });
    }
};


exports.fetchAndCacheNews = fetchAndCacheNews;