const axios = require("axios");

const API_KEY = "AIzaSyAWXyyQJROx0j-oBJysXkpxjEUdZpotJJc"; // use the same key as curl
const query = "flood disaster preparedness";

axios
  .get(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=video&maxResults=3&key=${API_KEY}`
  )
  .then((res) => {
    console.log(res.data.items.map((item) => item.snippet.title));
  })
  .catch((err) => {
    console.error("YouTube API error:", err.response?.status, err.response?.data);
  });
