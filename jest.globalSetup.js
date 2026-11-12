// Run every test in a timezone ahead of UTC so local-vs-UTC date bugs show up
// on any machine, including CI servers that run in UTC.
module.exports = async () => {
  process.env.TZ = 'Australia/Sydney';
};
