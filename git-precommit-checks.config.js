module.exports = {
  display: {
    notifications: true,
    offendingContent: true,
    rulesSummary: false,
    shortStats: true,
    verbose: false,
  },
  rules: [
    {
      message:
        'Got some todos or fixmes in your code, you should take care of them!',
      nonBlocking: false,
      regex: /(?:FIXME|TODO)/,
    },
    {
      message:
        'Got some conflict markers in your code, you should take care of them!',
      regex: /^[<>|=]{4,}/m,
    },
    {
      message: 'Do not commit!',
      regex: /do not commit/i,
    },
    {
      // remove all console.log
      filter: /\.[jt]s$/,
      message: '🤔 remove console.log from code',
      nonBlocking: true,
      regex: /^\s*console\.log/,
    },
  ],
};
