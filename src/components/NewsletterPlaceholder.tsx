import React from 'react';

const NewsletterPlaceholder: React.FC = () => (
  <img
    src="/thumbnails/newsletter-default.jpg"
    alt="Newsletter"
    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    draggable={false}
  />
);

export default NewsletterPlaceholder;
