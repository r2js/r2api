const sanitize = require('sanitize-html');
const dot = require('dotty');

module.exports = () => (
  {
    cleanHtml(schema, post) {
      if (typeof post === 'undefined') {
        return post;
      }

      if (typeof post === 'string' &&
          typeof schema.pattern === 'undefined'
      ) {
        return sanitize(post, dot.get(schema, 'settings.html') || {
          allowedTags: [],
          allowedAttributes: {},
        });
      }

      return post;
    },
  }
);
