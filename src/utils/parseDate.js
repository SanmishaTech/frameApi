const parseDate = (value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;

  const parsed = new Date(value); // Treats input as local time
  return isNaN(parsed) ? undefined : parsed;
};

module.exports = parseDate;
