// 관리자 신고함 mock 시드 데이터

export const REPORT_TYPES = ['스팸/광고', '욕설/비방', '음란물', '도배']

export const REPORT_SEED = [
  {
    id: 'rep-1',
    type: '스팸/광고',
    title: '[게시판] 무료 코인 받는 법 ★링크★',
    author: 'user_2914',
    board: '자유게시판',
    when: '방금 전',
    status: '미처리',
  },
  {
    id: 'rep-2',
    type: '욕설/비방',
    title: '작가 실력 관련 댓글 신고',
    author: 'nyang22',
    board: '작품 리뷰',
    when: '12분 전',
    status: '미처리',
  },
  {
    id: 'rep-3',
    type: '음란물',
    title: '19금 미표시 이미지 첨부글',
    author: 'admin_bot',
    board: '팬아트',
    when: '38분 전',
    status: '미처리',
  },
  {
    id: 'rep-4',
    type: '도배',
    title: '동일 글 6회 반복 게시',
    author: 'kim_web',
    board: '자유게시판',
    when: '1시간 전',
    status: '미처리',
  },
]
