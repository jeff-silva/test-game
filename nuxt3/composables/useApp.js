export default () => {
  const config = useRuntimeConfig();

  const baseUrl = (path = "") => {
    const u = new URL(location.href);
    let url = u.origin;

    if (config.app.baseURL) {
      if (!config.app.baseURL.startsWith("/")) {
        url += "/";
      }
      url += config.app.baseURL;
      if (!config.app.baseURL.endsWith("/") && !path.startsWith("/")) {
        url += "/";
      }
      url += path;
    }

    return url;
  };

  return { baseUrl };
};
