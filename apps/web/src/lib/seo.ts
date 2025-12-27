export function getJsonLdPageBreadcrumbs(title: string, path: string) {
  const entry = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://activityrank.me/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: `https://activityrank.me${path}`,
      },
    ],
  };
  return wrap(entry);
}

export function getHomeJsonLd(pageDescription: string) {
  const entry = [
    {
      '@context': 'https://schema.org',
      '@type': ['SoftwareApplication', 'WebApplication'],
      name: 'ActivityRank',
      operatingSystem: 'All',
      applicationCategory: 'SocialNetworkingApplication',
      description: pageDescription,
      featureList: [
        'Automated Discord leveling system',
        'Flexible activity tracking',
        'Advanced role management',
        'Comprehensive server statistics',
        'Automated member rewards',
      ],
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '4.99',
        priceCurrency: 'USD',
        offerCount: '2',
        offers: [
          {
            '@type': 'Offer',
            name: 'Free Tier',
            price: '0',
            priceCurrency: 'USD',
          },
          {
            '@type': 'Offer',
            name: 'Premium',
            price: '4.99',
            priceCurrency: 'USD',
          },
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ActivityRank',
      url: 'https://activityrank.me/',
      logo: 'https://activityrank.me/favicon-512x512.png',
      sameAs: ['https://discord.gg/DE3eQ8H'],
      member: [
        {
          '@type': 'Person',
          name: '@piemot',
          contactPoint: {
            '@type': 'ContactPoint',
            url: 'https://discord.com/users/774660568728469585',
          },
        },
        {
          '@type': 'Person',
          name: '@rapha01',
          contactPoint: {
            '@type': 'ContactPoint',
            url: 'https://discord.com/users/370650814223482880',
          },
        },
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: 'https://activityrank.me/support',
      },
    },
  ];
  return wrap(entry);
}

function wrap(value: unknown) {
  return `<script type="application/ld+json">${JSON.stringify(value, null, 2)}</script>`;
}
