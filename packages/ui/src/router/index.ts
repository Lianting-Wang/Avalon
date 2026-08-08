import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { routesSeo } from '@/router/seo';
import type { TMultiLangRoute, TNormalizedLangRoute } from '@/router/seo';
import Lobby from '@/pages/lobby/Lobby.vue';
import cloneDeep from 'lodash/cloneDeep';
import {
  buildLocalizedPath,
  DEFAULT_LANGUAGE,
  languageFromPath,
  LanguageMap,
  supportedLanguages,
  TLanguage,
} from '@/helpers/i18n';
import { s3ImagesPath } from '@/helpers/images';
import { i18n } from '@/plugins/i18n';

const routeComponentMap = {
  lobby: Lobby,
  wiki: () => import('@/pages/wiki/Index.vue'),
  notFound: () => import('@/pages/empty/NotFound.vue'),
  room: () => import('@/pages/room/Room.vue'),
  roles: () => import('@/pages/wiki/roles/Index.vue'),
  expansions: () => import('@/pages/wiki/addons/Index.vue'),
  lancelots: () => import('@/pages/wiki/roles/Lancelots.vue'),
  lady_of_lake: () => import('@/pages/wiki/addons/LadyOfTheLake.vue'),
  lady_of_sea: () => import('@/pages/wiki/addons/LadyOfTheSea.vue'),
  plot_cards: () => import('@/pages/wiki/addons/PlotCards.vue'),
  excalibur: () => import('@/pages/wiki/addons/Excalibur.vue'),
  morgana: () => import('@/pages/wiki/roles/Morgana.vue'),
  percival: () => import('@/pages/wiki/roles/Percival.vue'),
  rules: () => import('@/pages/wiki/Rules.vue'),
  lovers: () => import('@/pages/wiki/roles/Lovers.vue'),
  merlin: () => import('@/pages/wiki/roles/Merlin.vue'),
  about: () => import('@/pages/about/About.vue'),
  oberon: () => import('@/pages/wiki/roles/Oberon.vue'),
  mordred: () => import('@/pages/wiki/roles/Mordred.vue'),
  troublemaker: () => import('@/pages/wiki/roles/Troublemaker.vue'),
  trickster: () => import('@/pages/wiki/roles/Trickster.vue'),
  witch: () => import('@/pages/wiki/roles/Witch.vue'),
  brute: () => import('@/pages/wiki/roles/Brute.vue'),
  lunatic: () => import('@/pages/wiki/roles/Lunatic.vue'),
  guinevere: () => import('@/pages/wiki/roles/Guinevere.vue'),
  merlin_pure: () => import('@/pages/wiki/roles/MerlinPure.vue'),
  servant: () => import('@/pages/wiki/roles/Servant.vue'),
  minion: () => import('@/pages/wiki/roles/Minion.vue'),
  cleric: () => import('@/pages/wiki/roles/Cleric.vue'),
  revealer: () => import('@/pages/wiki/roles/Revealer.vue'),
  stats: () => import('@/pages/stats/Stats.vue'),
  profile: () => import('@/pages/profile/Profile.vue'),
  user_stats: () => import('@/pages/stats/UserStats.vue'),
  leaderboard: () => import('@/pages/leaderboard/Leaderboard.vue'),
  user_achievements: () => import('@/pages/achievements/UserAchievements.vue'),
  global_achievements: () => import('@/pages/achievements/GlobalAchievements.vue'),
};

function localizedRouteName(baseName: string, language: TLanguage): string {
  return language === DEFAULT_LANGUAGE ? baseName : `${baseName}${language.toLowerCase()}`;
}

export const routes: Array<RouteRecordRaw> = [];

Object.values(routesSeo).forEach((route) => {
  if (!('multiLanguage' in route.meta) || !route.meta.multiLanguage) {
    return;
  }

  const multiLangRoute = <TMultiLangRoute>route;
  const availableLocales = Object.keys(multiLangRoute.meta.multiLanguage) as TLanguage[];

  availableLocales.forEach((language) => {
    const clone = cloneDeep(multiLangRoute);
    const routeID = String(clone.name);
    const languageNormalized = language.toLowerCase();

    // @ts-ignore
    delete clone.meta.multiLanguage;

    // @ts-ignore
    (<TNormalizedLangRoute>(<unknown>clone)).meta = {
      ...clone.meta,
      availableLocales,
      lang: language,
      id: routeID,
      ...multiLangRoute.meta.multiLanguage[language],
    };

    clone.name = localizedRouteName(routeID, language);

    if (language !== DEFAULT_LANGUAGE) {
      clone.path = `/${languageNormalized}${clone.path}`;
    }

    routes.push(<RouteRecordRaw>{
      ...clone,
      component: routeComponentMap[<keyof typeof routeComponentMap>route.name],
    });
  });
});

const legacyRoleRedirects = [
  { path: '/wiki/roles/isolde/', target: 'lovers' },
  { path: '/wiki/roles/tristan/', target: 'lovers' },
  { path: '/wiki/roles/wraith/', target: 'oberon' },
  { path: '/wiki/roles/evil_lancelot/', target: 'lancelots' },
  { path: '/wiki/roles/good_lancelot/', target: 'lancelots' },
];

supportedLanguages.forEach((language) => {
  const prefix = language === DEFAULT_LANGUAGE ? '' : `/${language.toLowerCase()}`;

  legacyRoleRedirects.forEach(({ path, target }) => {
    routes.push({
      path: `${prefix}${path}`,
      redirect: { name: localizedRouteName(target, language) },
    });
  });
});

// Keep old /zh-cn/... links working, but make the no-prefix Chinese URL canonical.
routes.push({
  path: '/zh-cn/:pathMatch(.*)*',
  redirect: (to) => {
    const suffix = Array.isArray(to.params.pathMatch) ? to.params.pathMatch.join('/') : to.params.pathMatch || '';
    return `/${suffix}`;
  },
});

routes.push({
  path: '/:pathMatch(.*)*',
  redirect: (to) => {
    const language = languageFromPath(to.path) || DEFAULT_LANGUAGE;
    return { name: localizedRouteName('notFound', language) };
  },
});

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

const defaultKeywords: { [key in Lowercase<TLanguage>]: string[] } = {
  en: ['The Resistance', 'Avalon', 'Online', 'Board Game'],
  ru: ['Сопротивление', 'Авалон', 'Онлайн', 'Настольная Игра'],
  'zh-tw': ['反抗勢力', '亞瓦隆', '在線', '桌遊'],
  'zh-cn': ['反抗组织', '阿瓦隆', '在线', '桌游'],
  es: ['La Resistencia', 'Avalon', 'En línea', 'Juego de mesa'],
  pt: ['The Resistance', 'Avalon', 'Online', 'Jogo de tabuleiro'],
};

// Most internal links use the base route name. When a user is already browsing a
// prefixed language, transparently resolve those links to the same language.
router.beforeEach((to, from) => {
  const fromLanguage = <TLanguage | undefined>from.meta.lang;
  const toLanguage = <TLanguage | undefined>to.meta.lang;
  const hasExplicitLanguagePrefix = Boolean(languageFromPath(to.path));

  if (
    from.name &&
    fromLanguage &&
    fromLanguage !== DEFAULT_LANGUAGE &&
    to.meta.id &&
    toLanguage === DEFAULT_LANGUAGE &&
    !hasExplicitLanguagePrefix
  ) {
    const name = localizedRouteName(String(to.meta.id), fromLanguage);

    if (router.hasRoute(name)) {
      return {
        name,
        params: to.params,
        query: to.query,
        hash: to.hash,
      };
    }
  }
});

router.afterEach((to) => {
  const routeLanguage = (<TLanguage | undefined>to.meta.lang) || languageFromPath(to.path) || DEFAULT_LANGUAGE;

  i18n.global.locale.value = routeLanguage;
  document.documentElement.lang = routeLanguage;

  const meta = to.meta;
  const keywords = <string[]>meta.keywords ?? [];
  const image = <string>meta.image || 'roles/merlin.webp';
  const url = window.location.origin;

  document.querySelector('head meta[property="og:image"]')?.setAttribute('content', `${s3ImagesPath}${image}`);

  if (meta.title) {
    document.title = <string>meta.title;
    document.querySelector('head meta[property="og:title"]')?.setAttribute('content', <string>meta.title);
  }

  if (meta.description) {
    document.querySelector('head meta[name="description"]')?.setAttribute('content', <string>meta.description);
    document.querySelector('head meta[property="og:description"]')?.setAttribute('content', <string>meta.description);
  }

  const keywordLanguage = routeLanguage.toLowerCase() as Lowercase<TLanguage>;
  document
    .querySelector('head meta[name="keywords"]')
    ?.setAttribute('content', [...keywords, ...(defaultKeywords[keywordLanguage] || [])].join(', '));

  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url + to.path);
  document.querySelector('head meta[property="og:url"]')?.setAttribute('content', url + to.path);

  document.querySelectorAll('link[rel="alternate"]').forEach((link) => link.parentNode?.removeChild(link));

  if (meta.availableLocales) {
    (<Array<TLanguage>>meta.availableLocales).forEach((language) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = language;
      link.href = url + buildLocalizedPath(to.path, language);
      document.head.appendChild(link);
    });

    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = url + buildLocalizedPath(to.path, DEFAULT_LANGUAGE);
    document.head.appendChild(defaultLink);
  }
});

export default router;
