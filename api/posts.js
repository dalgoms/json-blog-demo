const { Client } = require('@notionhq/client');

const notion = new Client({ auth: (process.env.NOTION_API_KEY || '').trim() });
const databaseId = (process.env.NOTION_DATABASE_ID || '').trim();

function getRichText(prop) {
  if (!prop || !prop.rich_text || !prop.rich_text.length) return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=59');

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: '날짜', direction: 'descending' }],
    });

    const posts = response.results.map((page, idx) => {
      const p = page.properties;
      return {
        id: idx + 1,
        title: p['제목']?.title?.map(t => t.plain_text).join('') || '',
        date: p['날짜']?.date?.start || '',
        category: p['카테고리']?.select?.name || '',
        thumbnail: p['썸네일']?.url || '',
        summary: getRichText(p['요약']),
        content: getRichText(p['본문']),
      };
    });

    res.status(200).json({
      blog: {
        title: 'Blog Tech',
        description: 'JSON 하나로 운영하는 블로그',
      },
      posts,
    });
  } catch (err) {
    console.error('Notion API error:', err.message, err.code);
    res.status(500).json({
      error: 'Failed to fetch from Notion',
      detail: err.message,
      hasKey: !!process.env.NOTION_API_KEY,
      hasDb: !!process.env.NOTION_DATABASE_ID,
      keyLen: (process.env.NOTION_API_KEY || '').trim().length,
    });
  }
};
