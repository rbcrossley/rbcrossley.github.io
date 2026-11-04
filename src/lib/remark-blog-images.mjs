const BLOG_IMAGE_PATH = '/images/blog/';

function normalizeImageUrl(url) {
  const siteImage = url.match(
    /^(?:https?:)?\/\/(?:www\.)?berojgarengineer\.com(\/images\/blog\/[^?#]*)(\?[^#]*)?(#.*)?$/i
  );
  if (siteImage) return `${siteImage[1]}${siteImage[2] || ''}${siteImage[3] || ''}`;
  if (/^(?:https?:)?\/\//i.test(url) || /^(?:data|blob):/i.test(url)) {
    return url;
  }

  const normalized = url.replace(/\\/g, '/');
  const [pathname, ...suffixParts] = normalized.split(/(?=[?#])/);
  const suffix = suffixParts.join('');

  if (/^\/?images\/blog\//i.test(pathname)) {
    return `/${pathname.replace(/^\/+/, '')}${suffix}`;
  }

  if (/^\/?images\//i.test(pathname)) {
    return `/${pathname.replace(/^\/+/, '')}${suffix}`;
  }

  const trimmedPath = pathname.replace(/^\/+/, '');
  const relativePath = /^[a-z]:\//i.test(normalized) || normalized.startsWith('/')
    ? trimmedPath.split('/').pop()
    : trimmedPath.replace(/^(?:\.\.\/|\.\/)+/, '');

  return `${BLOG_IMAGE_PATH}${relativePath}${suffix}`;
}

function addImageProperties(image) {
  image.url = normalizeImageUrl(image.url);
  image.data = image.data ?? {};
  image.data.hProperties = {
    ...image.data.hProperties,
    width: 360,
    loading: 'lazy',
    decoding: 'async',
  };
}

function transformChildren(node, insideLink = false) {
  if (!Array.isArray(node.children)) return;

  node.children = node.children.flatMap((child) => {
    if (child.type === 'image') {
      addImageProperties(child);
      if (insideLink) return [child];

      const label = child.alt ? `View the full-size ${child.alt}` : 'View the full-size image';
      return [{
        type: 'link',
        url: child.url,
        title: null,
        children: [child],
        data: {
          hProperties: {
            className: ['blog-image-link'],
            target: '_blank',
            rel: 'noopener',
            'aria-label': label,
          },
        },
      }];
    }

    transformChildren(child, insideLink || child.type === 'link');
    return [child];
  });
}

export default function remarkBlogImages() {
  return (tree) => transformChildren(tree);
}
