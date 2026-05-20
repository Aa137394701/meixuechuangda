const wuxingUtils = require('./cloudfunctions/generateOOTD/wuxing')

const birthdays = ['2008-04-08', '2002-07-11', '1987-08-14', '1991-05-01', '2010-04-08']
const currentDate = '2026-05-12'

console.log('=== 测试不同生日的 missingWuxing ===')
console.log('当日日期:', currentDate)
console.log('')

birthdays.forEach(birthday => {
  const missingWuxing = wuxingUtils.getMissingWuxing(birthday, currentDate)
  const userWuxing = wuxingUtils.getUserWuxing(birthday)
  const dailyWuxing = wuxingUtils.getDailyWuxing(2026, 5, 12)
  
  console.log(`生日: ${birthday}`)
  console.log(`  用户五行 - 年: ${userWuxing.year}, 月: ${userWuxing.month}, 日: ${userWuxing.day}`)
  console.log(`  当日五行: ${dailyWuxing.element}`)
  console.log(`  缺失五行: ${missingWuxing}`)
  console.log('')
})
