export interface ExternalLink {
  url: string;
  title: string;
  description: string;
  image?: string;
  type: 'youtube' | 'article' | 'facebook';
}

export const externalLinks: ExternalLink[] = [
  {
    url: 'https://youtu.be/8Nhh3R1ryEY',
    title: 'فيديو على يوتيوب - ناجح البارودي',
    description: 'محتوى فيديو عن ناجح البارودي',
    type: 'youtube',
    image: 'https://img.youtube.com/vi/8Nhh3R1ryEY/hqdefault.jpg'
  },
  {
    url: 'https://mgltmasr.com/2024/02/08/%D8%A8%D8%A7%D9%84%D8%B5%D9%88%D8%B1-%D8%A7%D9%84%D9%88%D8%B2%D8%B1%D8%A7%D8%A1-%D9%81%D9%89-%D8%B2%D9%81%D8%A7%D9%81-%D8%B3%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%A8%D8%A7%D8%B1%D9%88%D8%AF%D9%89-%D9%88/',
    title: 'بالصور.. الوزراء فى زفاف سارة البارودى وعبد الرحمن سامى زهنى',
    description: 'احتفل رجل الاعمال ناجح البارودى مدير عام شركة قناة السويس بزفاف كريمتة سارة الى عبدالرحمن سامى زهنى بحضور اللواءخالد عبد العال محافظ القاهرة واللواءاحمد راشد محافظ الجيزة واللواء ايمن نعيم مدير الخدمة الوطنية',
    type: 'article',
  },
  {
    url: 'https://www.facebook.com/share/v/1DJeQGQNQq/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/17UP4HDdW9/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/1DQH28RnLz/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/1DCKjBBnwM/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/1BaGFiSPrN/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/1Bt6JsmV4H/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/19a52YDQor/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
  {
    url: 'https://www.facebook.com/share/p/16Hm5Vkror/?mibextid=wwXIfr',
    title: 'منشور على فيسبوك',
    description: 'محتوى من فيسبوك',
    type: 'facebook',
  },
];

