// Language picker + EN/KN/HI dictionary for the public site chrome and
// search UI. Admin-entered content (stop names, announcements, blog text)
// is NOT translated — that would need a paid translation API.
//
// Usage: mark elements with data-i18n="key" (text), data-i18n-ph="key"
// (placeholder) or data-i18n-title="key" (title). applyI18n() fills them.
// site.js calls applyI18n(app) after every render. Missing keys fall back
// to English, so each dictionary can be partial.
(function () {
  const en = {
    search: 'Search', live: 'Live', routes: 'Routes', favorites: 'Favorites',
    blog: 'Blog', about: 'About',
    heroTitle: 'Never miss your bus',
    heroSub: 'Live scheduled arrivals for every stop — search a stop or plan a from-to journey.',
    byStop: 'By stop', byRoute: 'From → To',
    phStop: 'Search bus stop', phFavStop: 'Search favorite stops',
    phFrom: 'Starting stop', phTo: 'Destination stop',
    findBuses: 'Find buses',
    liveArrivals: 'Live arrivals',
    allStopsWord: 'bus stops',
    recent: 'Recent', favStops: 'Favorite stops',
    noStops: 'No stops found', noStopsSub: 'Try a different spelling.',
    noFavs: 'No favorite stops yet', noFavsSub: 'Tap the star on any stop to pin it here.',
    favsTitle: 'Favorite stops',
    allStops: 'All stops', busStop: 'Bus stop', now: 'Now',
    today: 'Today', tomorrow: 'Tomorrow',
    tomorrowSched: "Tomorrow's schedule",
    noBusesTomorrow: 'No buses tomorrow', noBusesTomorrowSub: 'There is no service scheduled at this stop tomorrow.',
    nextHour: 'Next hour', noBusesHour: 'No buses in the next hour', noBusesHourSub: 'The next buses are listed below.',
    noBusesAtAll: 'There are no more buses today.',
    showMore: 'Show more today', showLess: 'Show less',
    next30: 'Next 30 min', laterToday: 'Later today',
    noBusesNow: 'No buses right now', noBusesNowSub: 'The next buses are listed below.',
    noMoreToday: 'No more buses today', noMoreTodaySub: 'Check back tomorrow for the next services.',
    schedNote: 'Scheduled times. Actual arrival may vary with traffic.',
    printSchedule: 'Print schedule',
    stopNotFound: 'Stop not found', stopNotFoundSub: 'This code may be out of date. Search for your stop instead.',
    pickTwo: 'Pick two valid stops', pickTwoSub: 'Choose a "From" and "To" stop from the suggestions.',
    pickDiff: 'Pick two different stops',
    noDirect: 'No direct buses found',
    noDirectSub: 'No scheduled bus goes from {from} to {to} in that direction.',
    towards: 'Towards', endsHere: 'Ends at this stop',
    depart: 'Departed',
    backSoon: 'Back soon',
    maintDefault: 'We are performing scheduled maintenance. Bus timings will be back shortly — please check again soon.',
    maintNote: 'Scheduled maintenance — thank you for your patience.',
    maintBackIn: 'Back in',
    cannotLoad: 'Could not load timings', cannotLoadSub: 'Check your connection and refresh.',
    announcement: 'Announcement', gotIt: 'Got it',
    home: 'Home', privacy: 'Privacy Policy', terms: 'Terms of Service',
    cookiesPolicy: 'Cookie Policy', faq: 'FAQ', contact: 'Contact Us',
    footerTag: 'Live bus arrival times for your daily commute.',
    rights: 'All rights reserved.', indicative: 'Schedules are indicative — always confirm on the platform.',
    langPromptTitle: 'Choose your language', langPromptSub: 'You can change this anytime from the globe icon.',
    dontAsk: "Don't ask again",
    stopsCount: '{n} bus stops', resultsCount: '{n} result', resultsCountP: '{n} results',
    tripsCount: '{n} trips',
    stopCountInRoute: '{n} stops',
    busStopSingular: 'bus stop',
    latestPosts: 'Latest posts', readMore: 'Read more',
    blogTitle: 'Blog', blogSub: 'News, updates and service information.',
    postNotFound: 'Post not found', postNotFoundSub: 'This article may have been moved or unpublished.',
    backToBlog: '← All posts', publishedOn: 'Published',
    aboutTitle: 'About Bus Timings',
    noPosts: 'No posts yet', noPostsSub: 'Check back soon for updates.',
    viewProfile: 'View site',
  };

  // Kannada — short UI labels; longer sentences fall back to English.
  const kn = {
    search: 'ಹುಡುಕಾಟ', live: 'ಲೈವ್', routes: 'ಮಾರ್ಗಗಳು', favorites: 'ಮೆಚ್ಚಿನವು',
    blog: 'ಬ್ಲಾಗ್', about: 'ನಮ್ಮ ಬಗ್ಗೆ',
    heroTitle: 'ನಿಮ್ಮ ಬಸ್ ತಪ್ಪಿಸಬೇಡಿ',
    byStop: 'ನಿಲ್ದಾಣದಿಂದ', byRoute: 'ಇಂದ → ಗೆ',
    phStop: 'ಬಸ್ ನಿಲ್ದಾಣ ಹುಡುಕಿ', phFavStop: 'ಮೆಚ್ಚಿನ ನಿಲ್ದಾಣಗಳನ್ನು ಹುಡುಕಿ',
    phFrom: 'ಆರಂಭಿಕ ನಿಲ್ದಾಣ', phTo: 'ಗಂತವ್ಯ ನಿಲ್ದಾಣ',
    findBuses: 'ಬಸ್‌ಗಳನ್ನು ಹುಡುಕಿ',
    liveArrivals: 'ಲೈವ್ ಬಸ್ ಸಮಯಗಳು',
    allStopsWord: 'ಬಸ್ ನಿಲ್ದಾಣಗಳು',
    recent: 'ಇತ್ತೀಚಿನವು', favStops: 'ಮೆಚ್ಚಿನ ನಿಲ್ದಾಣಗಳು',
    favsTitle: 'ಮೆಚ್ಚಿನ ನಿಲ್ದಾಣಗಳು',
    allStops: 'ಎಲ್ಲಾ ನಿಲ್ದಾಣಗಳು', busStop: 'ಬಸ್ ನಿಲ್ದಾಣ', now: 'ಈಗ',
    today: 'ಇಂದು', tomorrow: 'ನಾಳೆ',
    tomorrowSched: 'ನಾಳೆಯ ವೇಳಾಪಟ್ಟಿ',
    nextHour: 'ಮುಂದಿನ ಗಂಟೆ',
    next30: 'ಮುಂದಿನ 30 ನಿಮಿಷ', laterToday: 'ಇಂದು ನಂತರ',
    printSchedule: 'ವೇಳಾಪಟ್ಟಿ ಮುದ್ರಿಸಿ',
    stopNotFound: 'ನಿಲ್ದಾಣ ಕಂಡುಬಂದಿಲ್ಲ',
    pickTwo: 'ಎರಡು ಸರಿಯಾದ ನಿಲ್ದಾಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    pickDiff: 'ಎರಡು ಬೇರೆಯ ನಿಲ್ದಾಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    noDirect: 'ನೇರ ಬಸ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    towards: 'ಕಡೆಗೆ', endsHere: 'ಈ ನಿಲ್ದಾಣದಲ್ಲಿ ಕೊನೆ',
    depart: 'ಹೋಗಿದೆ',
    backSoon: 'ಶೀಘ್ರದಲ್ಲೇ ಹಿಂತಿರುಗುತ್ತೇವೆ',
    announcement: 'ಪ್ರಕಟಣೆ', gotIt: 'ಅರ್ಥವಾಯಿತು',
    home: 'ಮುಖಪುಟ', privacy: 'ಗೌಪ್ಯ ನೀತಿ', terms: 'ಸೇವಾ ನಿಯಮಗಳು',
    cookiesPolicy: 'ಕುಕೀ ನೀತಿ', faq: 'ಪದರ', contact: 'ಸಂಪರ್ಕಿಸಿ',
    rights: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
    langPromptTitle: 'ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', dontAsk: 'ಮತ್ತೆ ಕೇಳಬೇಡಿ',
    readMore: 'ಇನ್ನಷ್ಟು ಓದಿ',
    blogTitle: 'ಬ್ಲಾಗ್', publishedOn: 'ಪ್ರಕಟಿಸಲಾಗಿದೆ', backToBlog: '← ಎಲ್ಲಾ',
    viewProfile: 'ಸೈಟ್ ವೀಕ್ಷಿಸಿ',
    heroSub: 'ಪ್ರತಿ ನಿಲುಗಡೆಗೆ ಲೈವ್ ನಿಗದಿತ ಆಗಮನಗಳು — ನಿಲುಗಡೆಯನ್ನು ಹುಡುಕಿ ಅಥವಾ ಒಂದು ಸ್ಥಳದಿಂದ ಇನ್ನೊಂದು ಸ್ಥಳಕ್ಕೆ ಪ್ರಯಾಣವನ್ನು ಯೋಜಿಸಿ.',
    noStops: 'ಯಾವುದೇ ನಿಲುಗಡೆಗಳನ್ನು ಕಂಡುಬಂದಿಲ್ಲ',
    noStopsSub: 'ಬೇರೆ ರೀತಿಯಲ್ಲಿ ಬರೆಯಲು ಪ್ರಯತ್ನಿಸಿ.',
    noFavs: 'ಇನ್ನೂ ಯಾವುದೇ ನೆಚ್ಚಿನ ನಿಲುಗಡೆಗಳಿಲ್ಲ',
    noFavsSub: 'ಇಲ್ಲಿ ಪಿನ್ ಮಾಡಲು ಯಾವುದೇ ನಿಲುಗಡೆ ಮೇಲೆ ಸ್ಟಾರ್ ಅನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ.',
    noBusesTomorrow: 'ನಾಳೆ ಬಸ್‌ಗಳಿಲ್ಲ',
    noBusesTomorrowSub: 'ನಾಳೆ ಈ ನಿಲುಗಡೆಯಲ್ಲಿ ಯಾವುದೇ ಸೇವೆಯನ್ನು ನಿಗದಿಪಡಿಸಲಾಗಿಲ್ಲ.',
    noBusesHour: 'ಮುಂದಿನ ಒಂದು ಗಂಟೆಯಲ್ಲಿ ಬಸ್‌ಗಳಿಲ್ಲ',
    noBusesHourSub: 'ಮುಂದಿನ ಬಸ್‌ಗಳನ್ನು ಕೆಳಗೆ ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ.',
    noBusesAtAll: 'ಇಂದು ಇನ್ನು ಹೆಚ್ಚಿನ ಬಸ್‌ಗಳಿಲ್ಲ.',
    showMore: 'ಇಂದು ಇನ್ನಷ್ಟು ತೋರಿಸಿ',
    showLess: 'ಕಡಿಮೆ ತೋರಿಸು',
    noBusesNow: 'ಈಗ ಯಾವುದೇ ಬಸ್‌ಗಳಿಲ್ಲ',
    noBusesNowSub: 'ಮುಂದಿನ ಬಸ್‌ಗಳನ್ನು ಕೆಳಗೆ ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ.',
    noMoreToday: 'ಇಂದು ಇನ್ನು ಬಸ್‌ಗಳಿಲ್ಲ',
    noMoreTodaySub: 'ಮುಂದಿನ ಸೇವೆಗಳಿಗಾಗಿ ನಾಳೆ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.',
    schedNote: 'ನಿಗದಿತ ಸಮಯಗಳು. ವಾಸ್ತವಿಕ ಆಗಮನವು ಟ್ರಾಫಿಕ್‌ನೊಂದಿಗೆ ಬದಲಾಗಬಹುದು.',
    stopNotFoundSub: 'ಈ ಕೋಡ್ ಹಳತಾಗಿರಬಹುದು. ಬದಲಿಗೆ ನಿಮ್ಮ ನಿಲುಗಡೆಗಾಗಿ ಹುಡುಕಿ.',
    pickTwoSub: 'ಸೂಚನೆಗಳಿಂದ \'ಇಂದ\' ಮತ್ತು \'ವರೆಗೆ\' ನಿಲುಗಡೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
    noDirectSub: 'ಆ ದಿಕ್ಕಿನಲ್ಲಿ {from} ನಿಂದ {to} ಗೆ ಯಾವುದೇ ನಿಗದಿತ ಬಸ್ ಹೋಗುವುದಿಲ್ಲ.',
    maintDefault: 'ನಾವು ನಿಗದಿತ ನಿರ್ವಹಣೆಯನ್ನು ನಡೆಸುತ್ತಿದ್ದೇವೆ. ಬಸ್ ಸಮಯಗಳು ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯವಾಗಲಿವೆ — ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.',
    maintNote: 'ನಿಗದಿತ ನಿರ್ವಹಣೆ — ನಿಮ್ಮ ತಾಳ್ಮೆಗೆ ಧನ್ಯವಾದಗಳು.',
    maintBackIn: 'ಗೆ ಹಿಂತಿರುಗಿ',
    cannotLoad: 'ಸಮಯಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
    cannotLoadSub: 'ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ರಿಫ್ರೆಶ್ ಮಾಡಿ.',
    footerTag: 'ನಿಮ್ಮ ದೈನಂದಿನ ಪ್ರಯಾಣಕ್ಕಾಗಿ ಬಸ್ ಆಗಮನದ ಲೈವ್ ಸಮಯಗಳು.',
    indicative: 'ವೇಳಾಪಟ್ಟಿಗಳು ಸೂಚನಾತ್ಮಕವಾಗಿವೆ — ಯಾವಾಗಲೂ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ದೃಢೀಕರಿಸಿ.',
    langPromptSub: 'ನೀವು ಇದನ್ನು ಗ್ಲೋಬ್ ಐಕಾನ್‌ನಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಬಹುದು.',
    stopsCount: '{n} ಬಸ್ ನಿಲ್ದಾಣಗಳು',
    resultsCount: '{n} ಫಲಿತಾಂಶ',
    resultsCountP: '{n} ಫಲಿತಾಂಶಗಳು',
    tripsCount: '{n} ಟ್ರಿಪ್‌ಗಳು',
    stopCountInRoute: '{n} ನಿಲುಗಡೆಗಳು',
    busStopSingular: 'ಬಸ್ ನಿಲ್ದಾಣ',
    latestPosts: 'ಇತ್ತೀಚಿನ ಪೋಸ್ಟ್‌ಗಳು',
    blogSub: 'ಸುದ್ದಿಗಳು, ಅಪ್‌ಡೇಟ್‌ಗಳು ಮತ್ತು ಸೇವಾ ಮಾಹಿತಿ.',
    postNotFound: 'ಕಂಡುಬಂದಿಲ್ಲ',
    postNotFoundSub: 'ಈ ಲೇಖನವನ್ನು ಸ್ಥಳಾಂತರಿಸಿರಬಹುದು ಅಥವಾ ಪ್ರಕಟಿಸದಿರಬಹುದು.',
    aboutTitle: 'ಬಸ್ ಸಮಯಗಳ ಬಗ್ಗೆ',
    noPosts: 'ಇನ್ನೂ ಯಾವುದೇ ಪೋಸ್ಟ್‌ಗಳಿಲ್ಲ',
    noPostsSub: 'ಅಪ್‌ಡೇಟ್‌ಗಳಿಗಾಗಿ ಶೀಘ್ರದಲ್ಲೇ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ.',
  };

  const hi = {
    search: 'खोजें', live: 'लाइव', routes: 'रूट', favorites: 'पसंदीदा',
    blog: 'ब्लॉग', about: 'हमारे बारे में',
    heroTitle: 'अपनी बस कभी न चूकें',
    heroSub: 'हर स्टॉप के लिए लाइव निर्धारित बस समय — स्टॉप खोजें या एक-से-दूसरे की यात्रा योजना बनाएं।',
    byStop: 'स्टॉप से', byRoute: 'यहाँ से → वहाँ',
    phStop: 'बस स्टॉप खोजें', phFavStop: 'पसंदीदा स्टॉप खोजें',
    phFrom: 'प्रारंभिक स्टॉप', phTo: 'गंतव्य स्टॉप',
    findBuses: 'बसें खोजें',
    liveArrivals: 'लाइव बस समय',
    allStopsWord: 'बस स्टॉप',
    recent: 'हाल ही के', favStops: 'पसंदीदा स्टॉप',
    noStops: 'कोई स्टॉप नहीं मिला', noStopsSub: 'कोई दूसरी वर्तनी आज़माएं।',
    noFavs: 'अभी कोई पसंदीदा स्टॉप नहीं', noFavsSub: 'किसी भी स्टॉप पर तारा टैप करें।',
    favsTitle: 'पसंदीदा स्टॉप',
    allStops: 'सभी स्टॉप', busStop: 'बस स्टॉप', now: 'अभी',
    today: 'आज', tomorrow: 'कल',
    tomorrowSched: 'कल का कार्यक्रम',
    noBusesTomorrow: 'कल कोई बस नहीं', noBusesTomorrowSub: 'इस स्टॉप पर कल कोई सेवा निर्धारित नहीं है।',
    nextHour: 'अगले एक घंटे', noBusesHour: 'अगले एक घंटे में कोई बस नहीं', noBusesHourSub: 'अगली बसें नीचे सूचीबद्ध हैं।',
    noBusesAtAll: 'आज और कोई बस नहीं है।',
    showMore: 'आज और दिखाएं', showLess: 'कम दिखाएं',
    next30: 'अगले 30 मिनट', laterToday: 'आज बाद में',
    noBusesNow: 'अभी कोई बस नहीं', noBusesNowSub: 'अगली बसें नीचे सूचीबद्ध हैं।',
    noMoreToday: 'आज और कोई बस नहीं', noMoreTodaySub: 'अगली सेवाओं के लिए कल देखें।',
    schedNote: 'निर्धारित समय। वास्तविक आगमन यातायात के कारण भिन्न हो सकता है।',
    printSchedule: 'समय-सारणी प्रिंट करें',
    stopNotFound: 'स्टॉप नहीं मिला', stopNotFoundSub: 'यह कोड पुराना हो सकता है। इसके बजाय अपना स्टॉप खोजें।',
    pickTwo: 'दो मान्य स्टॉप चुनें', pickTwoSub: 'सुझावों से एक "यहाँ से" और "वहाँ" स्टॉप चुनें।',
    pickDiff: 'दो अलग स्टॉप चुनें',
    noDirect: 'कोई सीधी बस नहीं मिली',
    noDirectSub: '{from} से {to} की ओर उस दिशा में कोई निर्धारित बस नहीं है।',
    towards: 'की ओर', endsHere: 'यह स्टॉप अंतिम है',
    depart: 'निकल गई',
    backSoon: 'जल्द ही वापस',
    maintDefault: 'हम निर्धारित रखरखाव कर रहे हैं। बस समय शीघ्र ही वापस आ जाएंगे — कृपया दोबारा जांचें।',
    maintNote: 'निर्धारित रखरखाव — आपके धैर्य के लिए धन्यवाद।',
    maintBackIn: 'वापसी में',
    cannotLoad: 'समय लोड नहीं हो सके', cannotLoadSub: 'अपना कनेक्शन जांचें और रीफ़्रेश करें।',
    announcement: 'घोषणा', gotIt: 'समझ गया',
    home: 'होम', privacy: 'गोपनीयता नीति', terms: 'सेवा की शर्तें',
    cookiesPolicy: 'कुकी नीति', faq: 'अक्सर पूछे जाने वाले प्रश्न', contact: 'संपर्क करें',
    footerTag: 'आपकी दैनिक यात्रा के लिए लाइव बस आगमन समय।',
    rights: 'सर्वाधिकार सुरक्षित।', indicative: 'समय-सारणी सांकेतिक हैं — कृपया प्लेटफ़ॉर्म पर पुष्टि करें।',
    langPromptTitle: 'अपनी भाषा चुनें', langPromptSub: 'आप इसे कभी भी ग्लोब आइकन से बदल सकते हैं।',
    dontAsk: 'फिर न पूछें',
    stopsCount: '{n} बस स्टॉप', resultsCount: '{n} परिणाम', resultsCountP: '{n} परिणाम',
    tripsCount: '{n} यात्राएं',
    stopCountInRoute: '{n} स्टॉप',
    busStopSingular: 'बस स्टॉप',
    latestPosts: 'नवीनतम पोस्ट', readMore: 'और पढ़ें',
    blogTitle: 'ब्लॉग', blogSub: 'समाचार, अपडेट और सेवा जानकारी।',
    postNotFound: 'पोस्ट नहीं मिली', postNotFoundSub: 'यह लेख स्थानांतरित या अप्रकाशित हो सकता है।',
    backToBlog: '← सभी पोस्ट', publishedOn: 'प्रकाशित',
    aboutTitle: 'बस समय के बारे में',
    noPosts: 'अभी कोई पोस्ट नहीं', noPostsSub: 'अपडेट के लिए जल्द ही देखें।',
    viewProfile: 'साइट देखें',
  };

  const dicts = { en, kn, hi };

  let lang = null;
  try { lang = localStorage.getItem('bt-lang'); } catch (e) {}

  function t(k, vars) {
    let s = (dicts[lang] && dicts[lang][k]) || en[k] || k;
    if (vars) for (const key in vars) s = s.split('{' + key + '}').join(vars[key]);
    return s;
  }

  function applyI18n(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.documentElement.lang = lang === 'kn' ? 'kn' : lang === 'hi' ? 'hi' : 'en';
  }

  const LANGS = [
    ['en', 'English'],
    ['kn', 'ಕನ್ನಡ'],
    ['hi', 'हिन्दी'],
  ];

  function setLang(l, askAgain) {
    lang = l;
    try {
      localStorage.setItem('bt-lang', l);
      if (askAgain === false) localStorage.setItem('bt-lang-set', '1');
    } catch (e) {}
    applyI18n();
    document.dispatchEvent(new CustomEvent('bt-lang', { detail: l }));
  }

  // Globe button + dropdown injected into the page header.
  function injectPicker() {
    const h = document.querySelector('header.top .h-right');
    if (!h || document.getElementById('langBtn')) return;
    const wrap = document.createElement('div');
    wrap.className = 'lang-wrap';
    wrap.innerHTML = `
      <button id="langBtn" class="btn btn-s btn-sm" title="Language" aria-label="Change language" aria-haspopup="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>
        <span id="langCur">EN</span>
      </button>
      <div id="langMenu" class="lang-menu" role="menu"></div>`;
    h.insertBefore(wrap, h.firstChild);
    const menu = wrap.querySelector('#langMenu');
    const drawMenu = () => {
      menu.innerHTML = LANGS.map(([c, n]) =>
        `<button role="menuitem" data-lang="${c}" class="${lang === c ? 'on' : ''}">${n}</button>`).join('');
      wrap.querySelector('#langCur').textContent = (lang || 'en').toUpperCase();
    };
    drawMenu();
    document.getElementById('langBtn').addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('on');
    });
    menu.addEventListener('click', e => {
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      setLang(b.dataset.lang);
      menu.classList.remove('on');
    });
    document.addEventListener('click', e => { { if (!wrap.contains(e.target)) menu.classList.remove('on'); } });
  }

  // First-visit prompt: ask once until the visitor picks a language or
  // ticks "don't ask again". Clearing site data naturally re-prompts.
  function maybePrompt() {
    let asked = null;
    try { asked = localStorage.getItem('bt-lang-set'); } catch (e) {}
    if (lang || asked === '1') return;
    const m = document.createElement('div');
    m.className = 'modal on';
    m.id = 'langPrompt';
    m.innerHTML = `<div class="box" style="max-width:340px">
      <h3 data-i18n="langPromptTitle">Choose your language</h3>
      <p class="sub" style="margin-top:6px" data-i18n="langPromptSub">You can change this anytime from the globe icon.</p>
      <div class="lang-choices">${LANGS.map(([c, n]) =>
        `<button class="btn btn-s" data-pick="${c}" style="flex:1">${n}</button>`).join('')}</div>
      <label class="sub" style="display:flex;gap:8px;align-items:center;justify-content:center;margin-top:14px;font-size:13px">
        <input type="checkbox" id="langDontAsk"> <span data-i18n="dontAsk">Don't ask again</span>
      </label>
      <button class="btn btn-s btn-sm" id="langLater" style="margin-top:10px">Maybe later</button>
    </div>`;
    document.body.appendChild(m);
    applyI18n(m);
    m.addEventListener('click', e => {
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        const dont = m.querySelector('#langDontAsk').checked;
        setLang(pick.dataset.pick, !dont);
        m.remove();
        return;
      }
      if (e.target.id === 'langLater' || e.target === m) {
        if (m.querySelector('#langDontAsk').checked) {
          try { localStorage.setItem('bt-lang-set', '1'); } catch (err) {}
        }
        m.remove();
      }
    });
  }

  window.t = t;
  window.applyI18n = applyI18n;
  window.setLang = setLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectPicker(); applyI18n(); maybePrompt(); });
  } else {
    injectPicker(); applyI18n(); maybePrompt();
  }
})();
