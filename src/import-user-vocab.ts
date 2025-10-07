import { KoreanDatabase } from './database';
import * as dotenv from 'dotenv';

dotenv.config();

async function importVocabulary() {
  const database = new KoreanDatabase();
  
  // Your Korean vocabulary and grammar
  const vocabularyData = `
가지고 가다 - to take with
가져 가다 - to take with
밖에 나가야 돼요 - have to go outside
들어가다 - to go in
쫓아 다니다 - to chase around
그림 - painting
화가 - painter
걸다 - to hang
구멍 - hole
못 - nail
못을 박다 - to nail
벽 - wall
눕다 - to lie down
올려 놓다 - to put up
내려 놓다 - to put down
오르다 - to climb
올라가다 - to go up
올라오다 - to come up
데리러 가다 - to go pick up
데리러 오다 - to come pick up
펌킨스파이스라떼 - pumpkin spice latte
합치다 - to combine, merge
영상 - video
스트레칭 - stretching
등 - back
외우다 - to memorize
업힐 달리기 - uphill running
오르막길 - uphill path
내리막길 - downhill path
평평하다 - to be flat, even
맨발 - barefoot
최소한 - minimum
최대한 - maximum
복잡한 - complicated
단순하다 - to be simple
단순하게 - simply
흡수하다 - to absorb
충격 - shock
달리다 - to run
달리기하다 - to go for a run
영향 - influence, impact
유행 - trend
오트밀크 - oat milk
노래 - songs
만화 - cartoon, comics
요리사 - chef
대결 - battle, competition, match
소리가 나요 - there is a sound
질문 - question
문제 - problem
지역 - area
태어나다 - to be born
아무도 없었어요 - there was no one
고치다 - to fix
중요하다 - important
보여주다 - to show
느껴져요 - to feel like
완성되다 - to be completed
신경 안 쓰다 - don't care
단순해지다 - to become simple
요청하다 - to request
고민하다 - to think (considering)
도망가다 - run away
남다 - to remain/to be left
잘못하다 - to do something wrong
적용되다 - to be applied
이맘때쯤이면 - around this time
현재 - currently
드디어 - finally
달리기 - running
심심해요 - boring
지루한 - boring
방법 - method/way
물어 봤어요 - asked me
대부분 - mostly
목이 마르다 - thirsty
약속 - appointment
확인하다 - to check
확인되다 - to confirm
왜냐면 - because
시간 낭비 - waste of time
신기하다 - to be interesting
관심있다 - to be interested in
신기해요 - interesting!
관심하다 - interested
뭐라고 불러요 - what do you call it
화가 났어요 - are you angry
헷갈렸어요 - I was confused
챙기다 - to gather
챙겨 가다 - take with you
감정이 없다 - to not have emotions
불평하다 - to complain
등록했어 - signed up
지금까지 - until now
나이를 먹다 - to get older
경험 - experience
재밌는 경험 - fun experience
뭔가 보여 드릴게요 - let me show you something
최근에 - recently
궁금하면 - if you're curious
정반대 - totally opposite
동물 - animal
고르다 - choose
산텍하다 - choose
계산하다 - pay for something
어쩌라고 - so what
방문하다 - to visit
질긴 고기 - tough meat
예를들면 - for example
설치 - install
수리하다 - fix a thing
품질 - product quality
놀래다 - surprised
피부 - skin
리가 없어요 - there is no way/it can't be
이유 - reason
검은색 - black (color)
하얀색 - white (color)
줄 알다 - to know that
줄 모르다 - to not know that
줄이다 - to reduce
역할 - role
거리 - distance
지붕 - roof
쥐 - mouse
멍청하다 - to be stupid, dumb
스컹크 - skunk
배드민턴 - badminton
Wholefoods - Wholefoods
Aldi - Aldi
비닐 봉지 - plastic bag
고양이 간식 - cat treat
똑똑하다 - to be smart
바보 - fool
멍청한 사람 - stupid person
새아빠 - stepfather
아빠 역할 - father role
새집 - new house
친구가 되다 - to become friends
올라가다 - to go up
새 - bird
잡다 - to catch
`;

  console.log('📚 Starting vocabulary import...');
  
  // Split by lines and process each line
  const lines = vocabularyData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let importedCount = 0;
  let skippedCount = 0;

  for (const line of lines) {
    try {
      // Try different formats
      let korean = '';
      let english = '';

      // Format 1: "Korean - English"
      if (line.includes(' - ')) {
        const parts = line.split(' - ');
        korean = parts[0].trim();
        english = parts[1].trim();
      }
      // Format 2: "Korean: English"
      else if (line.includes(': ')) {
        const parts = line.split(': ');
        korean = parts[0].trim();
        english = parts[1].trim();
      }
      // Format 3: "Korean English" (space separated)
      else if (line.includes(' ')) {
        const parts = line.split(' ');
        korean = parts[0].trim();
        english = parts.slice(1).join(' ').trim();
      }
      // Format 4: Just Korean word (skip if no English)
      else {
        console.log(`⚠️ Skipping line (no English found): ${line}`);
        skippedCount++;
        continue;
      }

      // Validate that we have both Korean and English
      if (korean && english && korean.length > 0 && english.length > 0) {
        // Check if already exists
        const existing = await database.getAllVocabulary();
        const alreadyExists = existing.some(word => 
          word.korean === korean && word.english === english
        );

        if (!alreadyExists) {
          await database.storeVocabulary([{
            korean: korean,
            english: english
          }]);
          console.log(`✅ Added: ${korean} - ${english}`);
          importedCount++;
        } else {
          console.log(`⏭️ Already exists: ${korean} - ${english}`);
          skippedCount++;
        }
      } else {
        console.log(`⚠️ Skipping line (invalid format): ${line}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing line "${line}":`, error);
      skippedCount++;
    }
  }

  console.log(`\n📊 Import Summary:`);
  console.log(`✅ Imported: ${importedCount} words`);
  console.log(`⏭️ Skipped: ${skippedCount} words`);
  console.log(`📚 Total in database: ${(await database.getAllVocabulary()).length} words`);
  
  await database.close();
}

// Run the import
importVocabulary().catch(console.error);





