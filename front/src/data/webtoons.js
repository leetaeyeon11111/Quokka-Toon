// mock 웹툰 데이터셋 (백엔드 연동 전까지 프론트 단독 구동용)
// 실제 서비스에서는 이 파일 대신 API 응답을 사용하게 된다.

import { mediaMixByTitle } from './mediaMix'

const PLATFORMS = {
  네이버: 'https://comic.naver.com',
  카카오: 'https://webtoon.kakao.com',
  레진: 'https://www.lezhin.com',
  투믹스: 'https://www.toomics.com',
  탑툰: 'https://www.toptoon.com',
  봄툰: 'https://www.bomtoon.com',
  기타: '#',
}

const COVER_PALETTES = [
  ['#ffb199', '#ff6b6b'],
  ['#a1c4fd', '#c2e9fb'],
  ['#f6d365', '#fda085'],
  ['#d4fc79', '#96e6a1'],
  ['#84fab0', '#8fd3f4'],
  ['#f5576c', '#f093fb'],
  ['#4facfe', '#00f2fe'],
  ['#fbc2eb', '#a6c1ee'],
  ['#c471f5', '#fa71cd'],
  ['#30cfd0', '#330867'],
]

function tags(pairs) {
  return pairs.map(([name, weight]) => ({ name, weight }))
}

function makeReviews(seedId, entries) {
  return entries.map(([user, rating, text, likes], idx) => ({
    id: `${seedId}-review-${idx}`,
    user,
    rating,
    text,
    likes,
  }))
}

function makeDemographics(femaleRatio, base) {
  const female = femaleRatio
  const male = 100 - female
  return {
    genderRatio: { male, female },
    genderRating: {
      male: Number((base - 0.5 + Math.random() * 0.4).toFixed(2)),
      female: Number((base + 0.1 + Math.random() * 0.4).toFixed(2)),
    },
    ageRatings: [
      { age: '10대', avg: Number((base + 0.3).toFixed(2)), count: 60 + Math.round(Math.random() * 60) },
      { age: '20대', avg: Number((base - 0.1).toFixed(2)), count: 400 + Math.round(Math.random() * 500) },
      { age: '30대', avg: Number((base - 0.3).toFixed(2)), count: 300 + Math.round(Math.random() * 500) },
      { age: '40대', avg: Number((base - 0.4).toFixed(2)), count: 80 + Math.round(Math.random() * 120) },
      { age: '50대 이상', avg: Number((base - 0.6).toFixed(2)), count: 10 + Math.round(Math.random() * 30) },
    ],
  }
}

const RAW_WEBTOONS = [
  {
    title: '깊은 곡선',
    writer: '김상이',
    artist: '비아이',
    genre: '로맨스',
    ageRating: '15세 이용가',
    platform: '네이버',
    catchphrase: '우리의 재회는 파멸의 시작일 뿐이야.',
    synopsis:
      '한때 서로를 파괴할 뻔했던 두 사람이 같은 회사 임원으로 재회한다. 감춰둔 애증이 다시 불붙으며 벌어지는 오피스 심리전.',
    tags: [
      ['비즈니스복수', 92],
      ['애증의재회', 90],
      ['오피스', 78],
      ['심리전', 85],
      ['복수', 88],
    ],
    reviews: [
      ['독자킴', 5, '애증 재회물의 정석. 심리전 최고.', 42],
      ['웹툰러', 4, '연출이 취향저격. 후반 살짝 아쉬움.', 28],
    ],
    femaleRatio: 72,
  },
  {
    title: '발화',
    writer: '영재영',
    artist: '영재영',
    genre: '드라마',
    ageRating: '15세 이용가',
    platform: '네이버',
    catchphrase: '가족이라는 이름의 불씨, 언젠가는 터진다.',
    synopsis:
      '평범한 가족의 비밀을 파헤치던 주인공이 자신도 모르던 트라우마와 오컬트적 사건에 휘말리며 성장해가는 이야기.',
    tags: [
      ['가족', 88],
      ['트라우마', 90],
      ['오컬트', 70],
      ['캠퍼스물', 55],
      ['피폐물', 82],
      ['성장물', 75],
    ],
    reviews: [
      ['달빛산책', 5, '떡밥 회수가 미쳤다. 매주 목요일이 기다려짐.', 86],
      ['눈팅러', 4, '연출은 최고인데 전개가 느린 편.', 31],
    ],
    femaleRatio: 20,
  },
  {
    title: '여신강림',
    writer: '야옹이',
    artist: '야옹이',
    genre: '로맨스',
    ageRating: '전체 이용가',
    platform: '네이버',
    catchphrase: '메이크업 하나로 인생이 바뀔 수 있을까.',
    synopsis: '외모 콤플렉스를 극복하려 화장을 시작한 여고생의 성장과 로맨스 학원물.',
    tags: [
      ['학원물', 90],
      ['로맨틱코메디', 80],
      ['외모지상', 75],
      ['성장물', 70],
      ['첫사랑', 65],
    ],
    reviews: [
      ['뷰티러버', 4, '연출 완전 취향저격이었음.', 55],
      ['그냥독자', 3, '최근 전개는 좀 아쉬웠다.', 12],
    ],
    femaleRatio: 78,
  },
  {
    title: '나 혼자만 레벨업',
    writer: '추공',
    artist: '장성락',
    genre: '액션',
    ageRating: '15세 이용가',
    platform: '카카오',
    catchphrase: '세상에서 제일 약한 헌터가, 유일하게 레벨업한다.',
    synopsis: '최약체 헌터가 시스템의 선택을 받아 끝없이 강해지며 세계의 비밀에 다가서는 액션 판타지.',
    tags: [
      ['헌터물', 95],
      ['레벨업', 93],
      ['먼치킨', 88],
      ['액션', 90],
      ['성장물', 80],
    ],
    reviews: [
      ['태윤', 5, '애니 나온 뒤로 다시 정주행.', 15],
      ['액션덕후', 5, '작화 미쳤다.', 60],
    ],
    femaleRatio: 30,
  },
  {
    title: '전지적 독자 시점',
    writer: 'sing N song',
    artist: '슬리피-C',
    genre: '판타지',
    ageRating: '15세 이용가',
    platform: '카카오',
    catchphrase: '이 세계의 결말을 아는 건, 오직 나뿐이다.',
    synopsis: '유일하게 완결까지 읽은 소설이 현실이 된 세계에서 생존과 회귀를 반복하는 이야기.',
    tags: [
      ['환생', 85],
      ['먼치킨', 80],
      ['세계관', 92],
      ['액션', 82],
      ['두뇌싸움', 78],
    ],
    reviews: [
      ['독자킴', 5, '1부 결말 다시 봐도 소름.', 42],
      ['원작러버', 5, '작화, 연출 다 완벽.', 70],
    ],
    femaleRatio: 35,
  },
  {
    title: '입술 위 눈물자국',
    writer: '민서하',
    artist: '오하늘',
    genre: 'BL',
    ageRating: '19세 이용가',
    platform: '레진',
    catchphrase: '너를 미워하려 했는데, 자꾸 마음이 간다.',
    synopsis: '나쁜 남자로 소문난 선배와 얽히게 된 신입생의 아슬아슬한 감정선을 그린 BL 드라마.',
    tags: [
      ['나쁜남자', 90],
      ['오메가버스', 60],
      ['집착남', 85],
      ['드라마', 70],
      ['첫사랑', 68],
    ],
    reviews: [
      ['신작헌터', 4, '신작인데 그림체 너무 좋다.', 20],
      ['비엘러버', 5, '연출력이 미쳤음.', 48],
    ],
    isAdult: true,
    femaleRatio: 82,
  },
  {
    title: '애늙은이',
    writer: '조석',
    artist: '조석',
    genre: '개그',
    ageRating: '전체 이용가',
    platform: '네이버',
    catchphrase: '몸은 애, 마음은 어른. 오늘도 사고 친다.',
    synopsis: '겉은 순수한 어린이지만 속은 40대 아저씨인 주인공의 좌충우돌 일상 개그.',
    tags: [
      ['개그', 90],
      ['일상', 75],
      ['병맛', 82],
      ['가족', 60],
      ['드라마', 40],
    ],
    reviews: [
      ['개그덕후', 5, '진짜 매화 웃긴다.', 90],
      ['일상러', 4, '가끔 감동도 줌.', 33],
    ],
    femaleRatio: 48,
  },
  {
    title: '코믹 무협 활극',
    writer: '무진',
    artist: '한바다',
    genre: '무협',
    ageRating: '15세 이용가',
    platform: '탑툰',
    catchphrase: '검을 잡은 순간부터, 웃음도 함께 시작된다.',
    synopsis: '얼떨결에 무림 최강 문파의 후계자가 된 얼간이가 좌충우돌하며 실력을 키워가는 코믹 무협.',
    tags: [
      ['무협', 88],
      ['개그', 70],
      ['성장물', 72],
      ['액션', 75],
      ['먼치킨', 60],
    ],
    reviews: [
      ['무협덕', 4, '진지함과 개그의 밸런스가 좋다.', 25],
      ['그냥독자', 4, '초반 조금 루즈함.', 9],
    ],
    femaleRatio: 25,
  },
  {
    title: '오메가의 계약결혼',
    writer: '하유',
    artist: '하유',
    genre: 'BL',
    ageRating: '19세 이용가',
    platform: '레진',
    catchphrase: '서류상의 결혼이었는데, 마음까지 계약한 줄은 몰랐다.',
    synopsis: '가문의 압박으로 계약 결혼을 하게 된 두 오메가버스 세계관 남자 주인공의 이야기.',
    tags: [
      ['오메가버스', 90],
      ['계약관계', 85],
      ['강공', 65],
      ['드라마', 70],
      ['다각관계', 40],
    ],
    reviews: [
      ['비엘러버', 5, '세계관 설정이 탄탄하다.', 38],
      ['독자A', 4, '그림체가 예쁘다.', 22],
    ],
    isAdult: true,
    femaleRatio: 85,
  },
  {
    title: '루벨파스트 정령사',
    writer: '한새',
    artist: '한새',
    genre: '판타지',
    ageRating: '전체 이용가',
    platform: '카카오',
    catchphrase: '버려진 정령 하나가, 왕국의 운명을 바꾼다.',
    synopsis: '몰락한 귀족 소녀가 전설의 정령을 만나며 벌어지는 정통 판타지 액션 모험.',
    tags: [
      ['정통판타지', 85],
      ['액션모험', 80],
      ['성장물', 78],
      ['세계관', 82],
      ['우정', 55],
    ],
    reviews: [
      ['판타지러', 5, '세계관 몰입도 최고.', 44],
      ['그림체최고', 4, '작화가 점점 좋아짐.', 19],
    ],
    femaleRatio: 40,
  },
  {
    title: '죽지 않는 남자와 견습기사',
    writer: '별세계',
    artist: '별세계',
    genre: '판타지',
    ageRating: '15세 이용가',
    platform: '카카오',
    catchphrase: '죽지 않는 주인공, 그럼에도 성장하는 이유.',
    synopsis: '불사의 몸을 가진 기사와 그를 따르는 견습기사 트루디아의 정통 판타지 액션 성장담.',
    tags: [
      ['불사', 80],
      ['액션', 85],
      ['성장물', 80],
      ['정통판타지', 75],
      ['사제관계', 60],
    ],
    reviews: [
      ['견습팬', 5, '주인공 성장 서사가 탄탄함.', 30],
      ['액션덕후', 4, '전투 작화가 시원시원.', 18],
    ],
    femaleRatio: 33,
  },
  {
    title: '잔불의 기사',
    writer: '산경',
    artist: '금강',
    genre: '판타지',
    ageRating: '15세 이용가',
    platform: '카카오',
    catchphrase: '꺼지지 않는 불씨 하나가, 다시 전장을 태운다.',
    synopsis: '몰락한 왕국의 마지막 기사가 재기를 위해 검을 다시 드는 정통 판타지 전쟁물.',
    tags: [
      ['정통판타지', 90],
      ['전쟁', 78],
      ['액션', 82],
      ['복수', 70],
      ['세계관', 85],
    ],
    reviews: [
      ['판타지러', 5, '전투 연출이 영화 같다.', 52],
      ['웹툰러', 4, '스토리가 진중하고 좋음.', 21],
    ],
    femaleRatio: 22,
  },
  {
    title: '더 스트리머',
    writer: '주동근',
    artist: '이희준',
    genre: '드라마',
    ageRating: '15세 이용가',
    platform: '네이버',
    catchphrase: '카메라가 켜지는 순간, 진짜 인생이 시작된다.',
    synopsis: '무명 스트리머가 방송을 통해 자신의 상처와 마주하며 성장하는 휴먼 드라마.',
    tags: [
      ['드라마', 88],
      ['현실공감', 80],
      ['성장물', 75],
      ['직업물', 65],
      ['힐링', 55],
    ],
    reviews: [
      ['공감러', 5, '내 얘기 같아서 울었다.', 40],
      ['눈팅러', 4, '연출이 담백해서 좋음.', 15],
    ],
    femaleRatio: 55,
  },
  {
    title: '서른의 봄',
    writer: '하일권',
    artist: '하일권',
    genre: '일상',
    ageRating: '전체 이용가',
    platform: '네이버',
    catchphrase: '서른, 아직도 어른이 되는 중입니다.',
    synopsis: '어중간한 서른 살, 취업과 연애 사이에서 흔들리는 청춘들의 잔잔한 일상 이야기.',
    tags: [
      ['일상', 85],
      ['청춘', 80],
      ['힐링', 75],
      ['드라마', 60],
      ['공감', 65],
    ],
    reviews: [
      ['힐링러', 5, '읽으면 마음이 편안해짐.', 33],
      ['서른살', 5, '내 얘기 하는 줄.', 27],
    ],
    femaleRatio: 60,
  },
  {
    title: '비인간서사',
    writer: '이연',
    artist: '이연',
    genre: '드라마',
    ageRating: '15세 이용가',
    platform: '봄툰',
    catchphrase: '인간이 아니어도, 이야기는 계속된다.',
    synopsis: '인간이 아닌 존재들의 눈으로 바라본 세상을 담담하게 풀어낸 옴니버스 드라마.',
    tags: [
      ['옴니버스', 78],
      ['드라마', 75],
      ['판타지', 60],
      ['철학적', 70],
      ['힐링', 50],
    ],
    reviews: [
      ['그림체최고', 5, '작화가 예술이다.', 45],
      ['눈팅러', 4, '생각할 거리를 주는 작품.', 20],
    ],
    femaleRatio: 58,
  },
  {
    title: '철롱고교',
    writer: '나승훈',
    artist: '나승훈',
    genre: '학원',
    ageRating: '15세 이용가',
    platform: '탑툰',
    catchphrase: '주먹보다 강한 건, 결국 의리다.',
    synopsis: '전학 온 학교에서 얽히게 된 일진 무리와의 갈등과 우정을 그린 학원 액션물.',
    tags: [
      ['학원액션', 88],
      ['우정', 75],
      ['일진물', 80],
      ['성장물', 65],
      ['드라마', 55],
    ],
    reviews: [
      ['액션덕후', 4, '전개가 시원시원함.', 24],
      ['학원물팬', 4, '클래식한 감성이 좋다.', 17],
    ],
    femaleRatio: 28,
  },
  {
    title: '우리에 대한 귀여운 War',
    writer: '설이',
    artist: '설이',
    genre: '로맨스',
    ageRating: '전체 이용가',
    platform: '카카오',
    catchphrase: '사랑싸움도 이 정도면 예술이지.',
    synopsis: '앙숙 같은 커플이 티격태격하면서도 서로에게 스며드는 알콩달콩 로맨틱 코미디.',
    tags: [
      ['로맨틱코메디', 90],
      ['티격태격', 82],
      ['첫사랑', 60],
      ['일상', 55],
      ['힐링', 50],
    ],
    reviews: [
      ['로코러버', 5, '보는 내내 웃음이 남.', 36],
      ['달달함추구', 5, '심장이 아파서 못 보겠다.', 41],
    ],
    femaleRatio: 80,
  },
  {
    title: '해골전령',
    writer: '유채',
    artist: '유채',
    genre: '판타지',
    ageRating: '15세 이용가',
    platform: '레진',
    catchphrase: '뼈밖에 안 남았지만, 전할 말은 남았다.',
    synopsis: '죽은 자의 마지막 소원을 전달하는 해골 전령과 그를 돕는 소녀의 다크 판타지.',
    tags: [
      ['다크판타지', 85],
      ['오컬트', 70],
      ['감성', 65],
      ['모험', 60],
      ['드라마', 68],
    ],
    reviews: [
      ['다크팬', 5, '세계관이 독특하고 좋다.', 29],
      ['그냥독자', 4, '그림체가 몽환적임.', 14],
    ],
    femaleRatio: 50,
  },
  {
    title: '아이스크림 뽀',
    writer: '민들레',
    artist: '민들레',
    genre: '개그',
    ageRating: '전체 이용가',
    platform: '기타',
    catchphrase: '녹기 전까지는, 무조건 웃긴다.',
    synopsis: '의인화된 아이스크림들의 편의점 알바 생존기를 그린 병맛 개그 만화.',
    tags: [
      ['병맛', 88],
      ['개그', 85],
      ['일상', 60],
      ['직업물', 55],
      ['짧은컷툰', 70],
    ],
    reviews: [
      ['개그덕후', 5, '3초컷 개그 실화냐.', 66],
      ['일상러', 4, '킬링타임용으로 최고.', 22],
    ],
    femaleRatio: 52,
  },
  {
    title: '뇌신전기',
    writer: '유이',
    artist: '유이',
    genre: '액션',
    ageRating: '15세 이용가',
    platform: '탑툰',
    catchphrase: '기억을 잃은 대신, 힘을 얻었다.',
    synopsis: '기억을 잃고 깨어난 전직 특수부대원이 배후 세력에 맞서 싸우는 액션 활극.',
    tags: [
      ['액션', 90],
      ['복수', 78],
      ['기억상실', 70],
      ['음모', 72],
      ['먼치킨', 65],
    ],
    reviews: [
      ['액션덕후', 5, '전투씬 퀄리티 미쳤다.', 48],
      ['웹툰러', 4, '스토리도 탄탄함.', 20],
    ],
    femaleRatio: 25,
  },
  {
    title: '신으로 사는 법',
    writer: '차야',
    artist: '차야',
    genre: '판타지',
    ageRating: '15세 이용가',
    platform: '카카오',
    catchphrase: '신이 되었다고, 인간미를 잃은 건 아니다.',
    synopsis: '얼떨결에 신이 되어버린 평범한 회사원의 좌충우돌 신계 적응기.',
    tags: [
      ['이세계', 82],
      ['개그', 70],
      ['성장물', 65],
      ['판타지', 78],
      ['일상', 50],
    ],
    reviews: [
      ['이세계팬', 4, '설정이 신선하고 재밌다.', 26],
      ['그냥독자', 4, '개그 코드가 잘 맞음.', 12],
    ],
    femaleRatio: 45,
  },
  {
    title: '학사신공',
    writer: '한빛',
    artist: '한빛',
    genre: '무협',
    ageRating: '15세 이용가',
    platform: '투믹스',
    catchphrase: '책상 앞에서 익힌 무공으로, 강호를 평정한다.',
    synopsis: '천재 학자가 우연히 얻은 무공서로 강호 최강이 되어가는 지략형 무협.',
    tags: [
      ['무협', 85],
      ['두뇌싸움', 78],
      ['먼치킨', 70],
      ['성장물', 68],
      ['액션', 72],
    ],
    reviews: [
      ['무협덕', 5, '두뇌싸움이 시원하다.', 34],
      ['액션덕후', 4, '전투도 볼만함.', 16],
    ],
    femaleRatio: 20,
  },
  {
    title: '성무신결',
    writer: '조돈파',
    artist: '희수',
    genre: '무협',
    ageRating: '15세 이용가',
    platform: '투믹스',
    catchphrase: '별의 힘을 품은 검, 무림을 다시 쓴다.',
    synopsis: '멸문한 문파의 유일한 생존자가 별의 힘이 깃든 무공으로 복수를 시작하는 무협 액션.',
    tags: [
      ['무협', 88],
      ['복수', 82],
      ['액션', 85],
      ['먼치킨', 75],
      ['세계관', 70],
    ],
    reviews: [
      ['무협덕', 5, '전투 연출이 화려함.', 39],
      ['웹툰러', 4, '떡밥 회수가 시원함.', 23],
    ],
    femaleRatio: 24,
  },
  {
    title: '레벨업 못하는 플레이어',
    writer: '산호',
    artist: '산호',
    genre: '판타지',
    ageRating: '15세 이용가',
    platform: '카카오',
    catchphrase: '남들 다 오르는 레벨, 나만 멈춰있다면?',
    synopsis: '레벨업이 막힌 최약체 플레이어가 다른 방식으로 강해지는 법을 찾아가는 헌터 판타지.',
    tags: [
      ['헌터물', 85],
      ['역경극복', 80],
      ['성장물', 82],
      ['액션', 75],
      ['두뇌싸움', 60],
    ],
    reviews: [
      ['헌터팬', 5, '설정이 신선해서 계속 보게 됨.', 31],
      ['그냥독자', 4, '초반 빌드업이 김.', 10],
    ],
    femaleRatio: 30,
  },
  {
    title: '외모지상주의 다이어리',
    writer: '박태준',
    artist: '박태준',
    genre: '학원',
    ageRating: '15세 이용가',
    platform: '네이버',
    catchphrase: '외모로 평가받는 세상, 그 이면을 들여다보다.',
    synopsis: '외모로 인한 차별과 콤플렉스를 소재로 다룬 학원 드라마.',
    tags: [
      ['외모지상', 85],
      ['학원물', 78],
      ['드라마', 72],
      ['성장물', 60],
      ['사회비판', 55],
    ],
    reviews: [
      ['그냥독자', 3, '최근 전개는 좀 아쉬웠다.', 12],
      ['공감러', 4, '생각할 거리를 던져줌.', 19],
    ],
    femaleRatio: 47,
  },
  {
    title: '떡볶이 사이코',
    writer: '유리',
    artist: '유리',
    genre: 'GL',
    ageRating: '15세 이용가',
    platform: '봄툰',
    catchphrase: '매운맛보다 강렬한, 우리의 첫 마음.',
    synopsis: '떡볶이 가게에서 우연히 만난 두 소녀의 풋풋하고 섬세한 감정선을 그린 GL 드라마.',
    tags: [
      ['첫사랑', 82],
      ['힐링', 70],
      ['일상', 65],
      ['성장물', 60],
      ['드라마', 55],
    ],
    reviews: [
      ['지엘러버', 5, '감정선이 섬세하고 좋다.', 27],
      ['힐링러', 4, '그림체가 따뜻함.', 15],
    ],
    femaleRatio: 88,
  },
]

export const WEBTOONS = RAW_WEBTOONS.map((raw, index) => {
  const id = `wt-${index + 1}`
  const [coverFrom, coverTo] = COVER_PALETTES[index % COVER_PALETTES.length]
  const reviews = makeReviews(id, raw.reviews)
  const ratingAvg = Number(
    (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
  )

  return {
    id,
    title: raw.title,
    authors: { writer: raw.writer, artist: raw.artist },
    genre: raw.genre,
    ageRating: raw.ageRating,
    isAdult: Boolean(raw.isAdult),
    tags: tags(raw.tags),
    synopsis: raw.synopsis,
    catchphrase: raw.catchphrase,
    coverGradient: `linear-gradient(135deg, ${coverFrom}, ${coverTo})`,
    platforms: [{ name: raw.platform, url: PLATFORMS[raw.platform] ?? '#' }],
    stats: {
      views: 30000 + index * 4173,
      ratingAvg,
      weeklyDay: ['월', '화', '수', '목', '금', '토', '일'][index % 7],
      commentCount: 20 + index * 7,
    },
    demographics: makeDemographics(raw.femaleRatio, ratingAvg),
    reviews,
    mediaMix: mediaMixByTitle(raw.title),
  }
})

export const GENRES = [
  '판타지',
  '액션',
  '개그',
  '로맨스',
  '드라마',
  '무협',
  '일상',
  '학원',
  'BL',
  'GL',
]

export const PLATFORM_NAMES = Object.keys(PLATFORMS)

export function getWebtoonById(id) {
  return WEBTOONS.find((webtoon) => webtoon.id === id)
}

export function getWebtoonsByAuthor(webtoon, limit = 5) {
  return WEBTOONS.filter(
    (candidate) =>
      candidate.id !== webtoon.id &&
      (candidate.authors.writer === webtoon.authors.writer ||
        candidate.authors.artist === webtoon.authors.artist),
  ).slice(0, limit)
}
