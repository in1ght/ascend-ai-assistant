const parseJson = (value, fallback = value) => {
  if (typeof value !== "string") return value ?? fallback;

  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

export const getHelperPayload = (msg) => (
  msg.helper_payload ?? msg.helperPayload ?? parseJson(msg.content, msg.content)
);

export const normalizeHelperMessage = (item) => (
  item?.speaker === 3
    ? { ...item, helper_payload: getHelperPayload(item) }
    : item
);

export const weatherIconUrl = (icon) => {
  if (!icon) return null;
  return icon.startsWith("//") ? `https:${icon}` : icon;
};
