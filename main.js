const axios = require('axios')
const fs = require('fs')
const schedule = require('node-schedule');
const accessToken = '填入token'
const file = 'answearList.txt'

// 公共请求头
const commonHeaders = {
  "accessToken": accessToken,
  "Host": "yfd.ly-sky.com",
  "Connection": "keep-alive",
  "Accept-Encoding": "gzip, deflate, br",
  "Content-Type": "application/json;charset=UTF-8",
  "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat",
  "userAuthType": "MS",
  "Referer":"https://servicewechat.com/wx217628c7eb8ec43c/104/page-frame.html"
}

// 获取自己问卷的 id
const getQuestionnaireIdUrl = 'https://yfd.ly-sky.com/ly-pd-mb/form/api/healthCheckIn/client/stu/index'
const getQuestionnaireId = () => {
  return axios({
    method: 'get',
    url: getQuestionnaireIdUrl,
    headers: commonHeaders
  })
}

// 获取今日问卷
const getQuestionnaire = id => {
  const getQuestionnaireUrl = `https://yfd.ly-sky.com/ly-pd-mb/form/api/questionnairePublish/${id}/getDetailWithAnswer`
  return axios({
    method: 'get',
    url: getQuestionnaireUrl,
    headers: {
      ...commonHeaders,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })
}

// 提交表单
const submitAnswersUrl = 'https://yfd.ly-sky.com/ly-pd-mb/form/api/answerSheet/saveNormal'
const submitAnswers = async (questionnaireId,answers) => {
  return axios({
      method: 'post',
      url: submitAnswersUrl,
      headers: commonHeaders,
      data: {
         "answerInfoList" : [
          ...answers         
        ],
        "questionnairePublishEntityId" : questionnaireId
      }
  })
}

handler = async () => {
    const questionnaireIdRes = await getQuestionnaireId()
    const data = questionnaireIdRes.data
    const questionnaireId = data.data.questionnairePublishEntityId
    getQuestionnaire(questionnaireId).then((a)=>{
      fs.access(file,(err)=>{
        if(err){
          let data
          answers = a.data.data.answerInfoList
          if(!answers){
            console.log('问卷答案为空且当前目录未记录问卷答案')
          }else{
            answers = answers.map(item => ({
              subjectId: item.subjectId,
              subjectType: item.subjectType,
              signleSelect:{beSelectValue:item.signleSelect.beSelectValue,fillContent:item.signleSelect.fillContent}
            }))
            data = JSON.stringify(answers)
          }
          fs.appendFile(file,data,(err)=>{
            if(err) throw err
          })
        }
        fs.readFile(file,'utf-8',(err,data)=>{
          let ans = JSON.parse(data)
          submitAnswers(questionnaireId,ans)
        })
      })
    })
}
const job = ()=>{
  schedule.scheduleJob('0 8 1 * * *',handler)
} 
job()
handler()

