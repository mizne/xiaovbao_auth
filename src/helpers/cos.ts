import * as fs from 'fs'
import axios from 'axios'
var COS = require('cos-nodejs-sdk-v5')
var cos = new COS({
    SecretId: 'AKID42tpcGX18f2EF5lDZkjXfhXN6e2FbpSu',
    SecretKey: 'RmxmkfPzQo2CGAsRq35EHXijYdlneK9s'
})

export function uploadCos(buffer: any) {
    const imageName = `${new Date().valueOf()}-${String(Math.random()).slice(
        0,
        5
    )}-image.png`
    return new Promise((resolve, reject) => {
        fs.writeFile(`${imageName}`, buffer, function (err) {
            if (err) {
                resolve({
                    resCode: 100,
                    resMsg: '保存图片到本地失败',
                    result: []
                })
            } else {
                console.log('保存图片到本地成功！')
                // 分片上传
                cos.sliceUploadFile(
                    {
                        Bucket: 'huizhanren-pad-image-1253522040',
                        Region: 'ap-shanghai',
                        Key: imageName,
                        FilePath: `./${imageName}`
                    },
                    function (err: Error, data: any) {
                        if (err) {
                            console.log(err)
                            resolve({
                                resCode: 100,
                                resMsg: '保存图片到腾讯云COS失败',
                                result: []
                            })
                        } else {
                            console.log(`上传腾讯云cos成功`)
                            fs.unlinkSync(imageName)
                            console.log(data.Location)
                            resolve({
                                resCode: 0,
                                resMsg: '保存图片成功！',
                                result: `https://${data.Location}`
                            })
                        }
                    }
                )
            }
        })
    })
}