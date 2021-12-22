# 9조 Final Project

## 기본스펙
- [x] 온라인에서 플레이가 가능하다.
- [x] 로그인, 회원가입
- [x] 10 * 10 이상의 맵
- [x] 캐릭터의 이동
- [x] 이동 시 필드별로 아무일도 일어나지 않음, 전투, 아이템 획득의 일이 일어남.
- [x] 5종 이상의 몬스터
- [x] 5종 이상의 아이템
- [x] 전투 시스템(str, def, hp 개념을 활용)
- [x] 사망 시스템(전투 시 hp가 0이될 경우 캐릭터가 사망. 0,0 위치로 이동)
- [x] 레벨 시스템(일정 이상 경험치 획득 시 캐릭터 레벨업)

## 추가스펙
- [x] 체력회복하는 이벤트가 추가된다.
- [x] 필드에서 일어나는 이벤트 중 랜덤이벤트가 존재한다.
- [x] 아이템을 소유할 경우, 캐릭터의 능력치가 향상된다. 능력치가 클라이언트에서 확인이 가능하다.
- [x] 시작 능력치가 랜덤하게 주어지며, 5번에 한하여 재시도가 가능하다.
- [x] 사망시 랜덤하게 아이템을 잃어버린다.
- [x] 유저의 인벤토리가 클라이언트 상에서 확인이 가능하다.
- [x] 전투 중, 10턴 안에 전투가 끝나지 않거나, 체력이 20% 이하로 감소할 경우 도망가는 선택지가 추가로 주어진다.

## 역할
- 김동현:
- 김범기:
- 이원준:
- 하성주:

## 게임 정보
> **코로나 바이러스로 살아남기**

### 맵
10×10 맵이며, 배경은 사람의 몸 내부이다.  
몸 속을 돌아다니며 코로나에 감염시키는 것이 목표이다.  
초기 능력치는 `maxHP` 10\~100, `str` 5\~30, `def` 5\~30 중 랜덤하게 주어지며, 5회까지 재시도할 수 있다.

### 이벤트
- **아무 일도 일어나지 않음**(10%)
- **배틀**(40%)
- **아이템**(20%)
- **체력 회복**(20%)  
`HP` +1 \~ +10 중 랜덤
- **랜덤 이벤트 발생**(10%)
  - mad  
`str` +3  `def` -1
  - strong  
`str` +1
  - teleport

### 몬스터
| 이름 | 특징 | 능력치 | 경험치 | 출현 확률 |
|:-----:|:-----:|-----|:-----:|:-----:|
| **해열제** | 최약체 | `str` 5<br>`def` 5<br>`HP` 20 | 10 | 30% |
| **백혈구** | 탱커 | `str` 15<br>`def` 30<br>`HP` 40 | 60 | 10% |
| **T세포** | 중간 보스 | `str` 20<br>`def` 25<br>`HP` 50 | 70 | 10% |
| **백신 항체** | 중간 보스 | `str` 30<br>`def` 15<br>`HP` 50 | 80 | 10% |
| **부스터샷 항체** | 보스? | `str` 0.5<br>`def` 0.5<br>`HP` 100 | 30 | 30% |
| **코로나 치료제** | 최종 보스 | `str` 35<br>`def` 35<br>`HP` 100 | 120 | 10% |

### 아이템
| 이름 | 효과 |
|:---:|---|
| **백신 돌파** | 방어력 상승 |
| **백신 부작용** | 상대 방어력 감소 |
| **면역력 저하** | 상대 체력 감소 |
| **밀집 시설 이용** | 변이 가능성 상승 = 경험치 증가 |
| **턱스크** | 최대 체력 증가 |

### 전투 방식
데미지는 `str-def`만큼 주어진다.  
10턴이 되거나 플레이어의 체력이 20% 이하인 경우에만 도망칠 수 있다.
사망 시에는 아이템 하나를 잃어버리고 원점으로 돌아가 다시 시작하거나, 새 플레이어로 다시 게임을 시작할 수 있다.
