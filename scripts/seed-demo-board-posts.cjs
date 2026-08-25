/**
 * 발표 시연용 계정 + 신고(비방/스팸/도배) / 칭찬 게시글 시드.
 * 재실행 시 같은 이메일·제목은 건너뛴다.
 *
 *   NODE_PATH=/tmp/qt-seed/node_modules node scripts/seed-demo-board-posts.cjs
 */
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const SECRET = path.join(__dirname, '../backend/secret.properties')
const DEMO_PASSWORD = 'demo123!'

const USERS = [
  { email: 'troll.demo@quokkatoon.local', nickname: '키보드워리어', gender: 'M', birth: '1998-03-12', level: 7, exp: 420 },
  { email: 'flame.demo@quokkatoon.local', nickname: '익명불만', gender: 'NONE', birth: '2001-11-02', level: 4, exp: 180 },
  { email: 'spam.demo@quokkatoon.local', nickname: '이벤트알리미', gender: 'F', birth: '1999-07-21', level: 2, exp: 40 },
  { email: 'flood.demo@quokkatoon.local', nickname: '도배왕', gender: 'M', birth: '2000-01-08', level: 3, exp: 90 },
  { email: 'fan.demo@quokkatoon.local', nickname: '별점만점러', gender: 'F', birth: '1997-05-30', level: 12, exp: 980 },
  { email: 'cheer.demo@quokkatoon.local', nickname: '응원요정', gender: 'F', birth: '2002-09-14', level: 9, exp: 610 },
  { email: 'reader.demo@quokkatoon.local', nickname: '정독러', gender: 'M', birth: '1996-12-01', level: 8, exp: 540 },
]

function loadProps() {
  return Object.fromEntries(
    fs.readFileSync(SECRET, 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i), l.slice(i + 1)]
      }),
  )
}

async function main() {
  const props = loadProps()
  const m = props.DB_URL.match(/mysql:\/\/([^:/]+):(\d+)\/([^?]+)/)
  const conn = await mysql.createConnection({
    host: m[1],
    port: +m[2],
    database: m[3],
    user: props.DB_USERNAME,
    password: props.DB_PASSWORD,
    ssl: false,
    charset: 'utf8mb4',
  })

  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10)
  const now = new Date()

  const userIds = {}
  for (const u of USERS) {
    const [exist] = await conn.query('SELECT user_id FROM `user` WHERE email = ?', [u.email])
    if (exist.length) {
      userIds[u.nickname] = exist[0].user_id
      continue
    }
    const [res] = await conn.query(
      `INSERT INTO \`user\`
        (email, password_hash, nickname, gender, birth_date, level, exp,
         warning_count, report_count, role, status, consecutive_visit_days, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'USER', 'ACTIVE', 3, ?, ?)`,
      [u.email, passwordHash, u.nickname, u.gender, u.birth, u.level, u.exp, now, now],
    )
    userIds[u.nickname] = res.insertId
  }

  const WT = {
    나혼렙: 29589,
    전독시: 24122,
    유미: 25647,
    화산: 24121,
    외지주: 23939,
  }

  // created_at 을 최신부터 내려가게 해서 목록 1페이지에 시연글이 모이게 한다.
  const posts = [
    {
      minutesAgo: 2,
      author: '키보드워리어',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 0,
      dislikes: 11,
      views: 48,
      title: '여기 관리자들 전부 뇌 없는 거 아님?',
      content:
        '글 삭제하고 계정 정지시키는 거 보니까 권력 맛에 취한 듯. 니들 하는 짓이 검열이지 운영이냐. 진짜 한심하다 꺼져라.',
      kind: 'abuse',
    },
    {
      minutesAgo: 5,
      author: '별점만점러',
      category: 2,
      webtoonId: WT.나혼렙,
      rating: 5,
      likes: 27,
      dislikes: 0,
      views: 91,
      title: '나 혼자만 레벨업은 명작 그 자체입니다',
      content:
        '정주행 세 번째인데도 전개가 아직도 짜릿해요. 성진우 성장 곡선이랑 작화 연출 덕분에 웹툰 입문작으로 주변에 계속 추천하고 있습니다. 작가님 감사합니다!',
      kind: 'praise',
    },
    {
      minutesAgo: 8,
      author: '익명불만',
      category: 2,
      webtoonId: WT.외지주,
      rating: 1,
      likes: 1,
      dislikes: 19,
      views: 62,
      title: '외모지상주의 작가는 재능이 없다 연재 접어라',
      content:
        '그림도 스토리도 쓰레기인데 왜 아직 올리냐. 작가가 독자 우습게 보는 거 아니냐. 이런 거 그리는 사람은 그냥 직업 바꾸셈. 보는 사람도 수준 낮다.',
      kind: 'abuse',
    },
    {
      minutesAgo: 11,
      author: '응원요정',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 18,
      dislikes: 0,
      views: 44,
      title: '추천 결과 너무 잘 맞아서 감동이에요',
      content:
        '취향 질문 대충 골랐는데도 제가 좋아할 만한 작품만 떠서 놀랐어요. 쿼카툰 팀 고생 많으십니다. 발표도 화이팅!',
      kind: 'praise',
    },
    {
      minutesAgo: 14,
      author: '이벤트알리미',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 0,
      dislikes: 8,
      views: 33,
      title: '지금 가입하면 문화상품권 3만원 드립니다',
      content:
        '선착순 100명!! 카톡 오픈채팅 "웹툰공짜방" 들어오시면 기프티콘 즉시 지급합니다. 링크: http://bit.ly/not-a-real-promo 문의는 외부 DM으로만 받습니다. 광고 아님 진짜임.',
      kind: 'spam',
    },
    {
      minutesAgo: 17,
      author: '정독러',
      category: 2,
      webtoonId: WT.전독시,
      rating: 5,
      likes: 22,
      dislikes: 1,
      views: 70,
      title: '전지적 독자 시점, 복선 회수가 예술이에요',
      content:
        '김독자 시점으로 다시 읽으니까 초반 대사가 전부 복선이더라고요. 웹툰 각색도 원작 팬 입장에서 만족스럽습니다. 아직 안 보신 분은 스포 없이 강추합니다.',
      kind: 'praise',
    },
    {
      minutesAgo: 20,
      author: '키보드워리어',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 2,
      dislikes: 14,
      views: 39,
      title: '별점만점러 너 가짜 리뷰 알바지?',
      content:
        '맨날 칭찬만 달고 있는 거 보니 작가가 돈 주고 부린 알바 아님? 얼굴도 보기 싫고 글도 보기 싫으니까 입 다물고 나가라. 위선자 새끼.',
      kind: 'abuse',
    },
    {
      minutesAgo: 23,
      author: '도배왕',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 0,
      dislikes: 6,
      views: 21,
      title: '쿼카툰 쿼카툰 쿼카툰 쿼카툰',
      content: '쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰',
      kind: 'flood',
    },
    {
      minutesAgo: 24,
      author: '도배왕',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 0,
      dislikes: 5,
      views: 18,
      title: '쿼카툰 쿼카툰 쿼카툰 쿼카툰 2',
      content: '쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰',
      kind: 'flood',
    },
    {
      minutesAgo: 25,
      author: '도배왕',
      category: 1,
      webtoonId: null,
      rating: null,
      likes: 0,
      dislikes: 5,
      views: 16,
      title: '쿼카툰 쿼카툰 쿼카툰 쿼카툰 3',
      content: '쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰 쿼카툰',
      kind: 'flood',
    },
    {
      minutesAgo: 30,
      author: '응원요정',
      category: 2,
      webtoonId: WT.유미,
      rating: 5,
      likes: 31,
      dislikes: 0,
      views: 84,
      title: '유미의 세포들 보면서 힐링하고 갑니다',
      content:
        '직장 끝나고 한 화만 보려다 다섯 화 봤어요. 유미랑 세포들 케미가 너무 따뜻해서 하루가 정리되는 느낌입니다. 이런 작품 더 많이 나왔으면 좋겠어요.',
      kind: 'praise',
    },
    {
      minutesAgo: 35,
      author: '별점만점러',
      category: 2,
      webtoonId: WT.화산,
      rating: 5,
      likes: 16,
      dislikes: 0,
      views: 55,
      title: '화산귀환 무협 연출이 영화예요',
      content:
        '액션 컷 나눔이 깔끔해서 스마트폰으로 봐도 안 흔들립니다. 청명 대사 맛집이고 매화 연출 나올 때마다 저장하고 있어요. 무협 입문에 최고!',
      kind: 'praise',
    },
  ]

  const commentsByTitle = {
    '나 혼자만 레벨업은 명작 그 자체입니다': [
      {
        author: '응원요정',
        minutesAgo: 4,
        likes: 8,
        text: '저도 입문작으로 추천하고 있어요. 공감합니다!',
      },
      {
        author: '키보드워리어',
        minutesAgo: 3,
        likes: 0,
        text: '이런 허접한 글에 추천이 왜 많냐. 알바 티 내지 마라 바보야.',
      },
    ],
    '추천 결과 너무 잘 맞아서 감동이에요': [
      {
        author: '정독러',
        minutesAgo: 9,
        likes: 5,
        text: '저도 취향 질문 결과가 잘 맞아서 놀랐어요. 팀 수고하셨습니다.',
      },
    ],
    '여기 관리자들 전부 뇌 없는 거 아님?': [
      {
        author: '정독러',
        minutesAgo: 1,
        likes: 3,
        text: '표현이 너무 과한 것 같아요. 신고하겠습니다.',
      },
    ],
  }

  const createdPosts = []
  for (const p of posts) {
    const [dup] = await conn.query('SELECT post_id FROM post WHERE title = ? AND is_deleted = 0', [p.title])
    const createdAt = new Date(Date.now() - p.minutesAgo * 60 * 1000)
    let postId
    if (dup.length) {
      postId = dup[0].post_id
    } else {
      const [res] = await conn.query(
        `INSERT INTO post
          (category_id, user_id, webtoon_id, title, content, rating,
           view_count, like_count, dislike_count, comment_count, is_deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
        [
          p.category,
          userIds[p.author],
          p.webtoonId,
          p.title,
          p.content.trim(),
          p.rating,
          p.views,
          p.likes,
          p.dislikes,
          createdAt,
          createdAt,
        ],
      )
      postId = res.insertId
    }
    createdPosts.push({ ...p, postId })
  }

  for (const p of createdPosts) {
    const extras = commentsByTitle[p.title] || []
    for (const c of extras) {
      const [dupC] = await conn.query(
        'SELECT comment_id FROM comment WHERE post_id = ? AND content = ? AND is_deleted = 0',
        [p.postId, c.text.trim()],
      )
      if (dupC.length) continue
      const createdAt = new Date(Date.now() - c.minutesAgo * 60 * 1000)
      await conn.query(
        `INSERT INTO comment (post_id, user_id, parent_id, content, like_count, is_deleted, created_at, updated_at)
         VALUES (?, ?, NULL, ?, ?, 0, ?, ?)`,
        [p.postId, userIds[c.author], c.text.trim(), c.likes, createdAt, createdAt],
      )
    }
    const [[{ cnt }]] = await conn.query(
      'SELECT COUNT(*) cnt FROM comment WHERE post_id = ? AND is_deleted = 0',
      [p.postId],
    )
    await conn.query('UPDATE post SET comment_count = ? WHERE post_id = ?', [cnt, p.postId])
  }

  const [[{ users }]] = await conn.query(
    "SELECT COUNT(*) users FROM `user` WHERE email LIKE '%.demo@quokkatoon.local'",
  )
  const titles = posts.map((p) => p.title)
  const [postRows] = await conn.query(
    `SELECT post_id, title, user_id FROM post WHERE title IN (${titles.map(() => '?').join(',')}) ORDER BY created_at DESC`,
    titles,
  )

  console.log(JSON.stringify({
    password: DEMO_PASSWORD,
    demoUsers: users,
    userIds,
    posts: postRows,
  }, null, 2))

  await conn.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
