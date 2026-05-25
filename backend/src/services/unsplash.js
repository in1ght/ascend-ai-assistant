const axios = require("axios");

const UNSPLASH_BASE_URL = "https://api.unsplash.com";

const getUnsplashAccessKey = () => (
  process.env.UPSPLASH_ACCESS_KEY ||
  process.env.UPSPLASH_ACCES_KEY
);

const getUnsplashPhoto = async (query) => {
  const accessKey = getUnsplashAccessKey();
  if (!accessKey || !query) return null;

  try {
    const { data } = await axios.get(`${UNSPLASH_BASE_URL}/search/photos`, {
      params: {
        client_id: accessKey,
        query,
        per_page: 1,
        orientation: "landscape",
        content_filter: "high",
      },
    });

    const photo = data.results?.[0];
    if (!photo) return null;

    return {
      url: photo.urls?.regular || photo.urls?.small || photo.urls?.raw,
      thumb: photo.urls?.small || photo.urls?.thumb,
      alt: photo.alt_description || photo.description || query,
      photographer: photo.user?.name,
      photographerUrl: photo.user?.links?.html,
      sourceUrl: photo.links?.html,
    };
  } catch (err) {
    console.warn("[unsplash] Could not load image", {
      query,
      message: err.message,
    });
    return null;
  }
};

module.exports = { getUnsplashPhoto };
