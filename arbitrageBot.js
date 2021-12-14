const mysql = require("mysql");
const uniSDK = require('@uniswap/sdk-core');
const uniSdkV2 = require('@uniswap/v2-sdk');
const axios = require("axios");
const sushiSdk =  require('@sushiswap/sdk')


var con = mysql.createConnection({
    host: "testdev.rungila.com",
    user: "user1",
    password: "_kVvPeE(S!#[XE_85@",
    database: "arbitrage",
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
  });

  let table = [];

  const init = async () => {
    await con.query(
      `SELECT * FROM m_common_pair where exchange_type = 'UNISWAP'  ORDER by pair_id desc limit 200`,
      async (err, result) => {
        if (err) throw err;
        result.forEach((element) => {
          table.push({
            symbol: element.symbol,
            token0: element.token0,
            token1: element.token1,
            amt_in_token: element.amt_in_token,
            exchanges: [
              {
                name: "uniswap",
                pairtoken: element.pairtoken,
                price0: "",
                price1: "",
              },
            ],
          });
        });
        if (result.length == table.length) {
          await con.query(
            `SELECT * FROM m_common_pair where exchange_type = 'SUSHISWAP' ORDER by pair_id desc limit 200`,
            function (err, result) {
              if (err) throw err;
              let i = 0;
              result.forEach((element) => {
                var getIndex = table.findIndex(
                  (pair) =>
                    pair.token0 === element.token0 &&
                    pair.token1 === element.token1
                );
                table[getIndex].exchanges.push({
                  name: "sushiswap",
                  pairtoken: element.pairtoken,
                  price0: "",
                  price1: "",
                });

                i++;
              });
              if (result.length == i) {
                for (let i = 0; i < table.length; i++) {
                  getExchangeValue(table[i]);
                }
              }
            }
          );
        }
      }
    );
  };

//   setInterval(()=>{
//     for (let i = 0; i < table.length; i++) {
//         getExchangeValue(table[i]);
//       }
//   },10000)


  const getExchangeValue = async (value) => {

    let uniswap = new Promise((resolve,rejects) => {
        let pariAddr = value.exchanges[0].pairtoken.toString();
        try {
          var data = "";

          var config = {
            method: "get",
            url: `http://localhost:5000/uniswap-price?pairAddress=${pariAddr}`,
            headers: {
              "Content-Type": "application/json",
            },
            data: data,
          };

          axios(config)
            .then(async (response) => {
              if (response.data.data.pair) {
                const token0 = new uniSDK.Token(1, response.data.data.pair.token0.id.toString(), parseInt(response.data.data.pair.token0.decimals))
                const token1 = new uniSDK.Token(1, response.data.data.pair.token1.id.toString(), parseInt(response.data.data.pair.token1.decimals))

                let uniswapReserve0 = response.data.data.pair.reserve0.replace('.','')
                let uniswapReserve1 = response.data.data.pair.reserve1.replace('.','')
            
                const pair = new uniSdkV2.Pair(
                    uniSDK.CurrencyAmount.fromRawAmount(token0,uniswapReserve0),
                    uniSDK.CurrencyAmount.fromRawAmount(token1,uniswapReserve1),
                  )
                    
                let inputValue = '1000';
                let inputValue1 = '2000';
                let inputValue2 = '10000';
                for(let i =0; i < parseInt(response.data.data.pair.token0.decimals); i++){
                    inputValue +='0'
                    inputValue1 +='0'
                    inputValue2 +='0'
                    if(i+1 == parseInt(response.data.data.pair.token0.decimals)){
                        const trade =  await new uniSdkV2.Trade(
                            new uniSdkV2.Route([pair], token0,token1),
                            uniSDK.CurrencyAmount.fromRawAmount(token0, inputValue),
                            uniSDK.TradeType.EXACT_INPUT
                          )
                        const trade1 =  await new uniSdkV2.Trade(
                            new uniSdkV2.Route([pair], token0,token1),
                            uniSDK.CurrencyAmount.fromRawAmount(token0, inputValue1),
                            uniSDK.TradeType.EXACT_INPUT
                          )
                        const trade2 =  await new uniSdkV2.Trade(
                            new uniSdkV2.Route([pair], token0,token1),
                            uniSDK.CurrencyAmount.fromRawAmount(token0, inputValue2),
                            uniSDK.TradeType.EXACT_INPUT
                          )
                          
                        let resultValue = {
                            trade: trade,
                            trade1: trade1,
                            trade2: trade2,
                            data: response.data.data.pair
                        }
                        resolve(resultValue)
                    }
                }               
              }
            })
            .catch(function (error) {
              rejects(error)
            });
        } catch (error) {
            rejects(error)
        }
        
    })
  
    let sushiswap = new Promise((resolve,rejects) => {

        let pariAddr1 = value.exchanges[1].pairtoken.toString();
        try {
          var data = "";

          var config = {
            method: "get",
            url: `http://localhost:5000/sushiswap-price?pairAddress=${pariAddr1}`,
            headers: {
              "Content-Type": "application/json",
            },
            data: data,
          };

          axios(config)
            .then(async (response) => {
              if (response.data.data.pair) {

                const sushiToken0 = new sushiSdk.Token(1, response.data.data.pair.token0.id.toString(), parseInt(response.data.data.pair.token0.decimals))
                const sushiToken1 = new sushiSdk.Token(1, response.data.data.pair.token1.id.toString(), parseInt(response.data.data.pair.token1.decimals))

                let sushiReserve0 = response.data.data.pair.reserve0.replace('.','')
                let sushiReserve1 = response.data.data.pair.reserve1.replace('.','')
            
                const shushiPair = new sushiSdk.Pair(
                    sushiSdk.CurrencyAmount.fromRawAmount(sushiToken0,sushiReserve0),
                    sushiSdk.CurrencyAmount.fromRawAmount(sushiToken1,sushiReserve1)
                  )

                let sushiInputValue = '1000';
                let sushiInputValue1 = '2000';
                let sushiInputValue2 = '10000';
                for(let i =0; i < parseInt(response.data.data.pair.token0.decimals); i++){
                    sushiInputValue +='0'
                    sushiInputValue1 +='0'
                    sushiInputValue2 +='0'
                    if(i+1 == parseInt(response.data.data.pair.token0.decimals)){
                        
                        const sushiTrade =  await new sushiSdk.Trade(
                             new sushiSdk.Route([shushiPair], sushiToken0,sushiToken1),
                             sushiSdk.CurrencyAmount.fromRawAmount(sushiToken0, sushiInputValue),
                             sushiSdk.TradeType.EXACT_INPUT
                           )
                        const sushiTrade1 =  await new sushiSdk.Trade(
                             new sushiSdk.Route([shushiPair], sushiToken0,sushiToken1),
                             sushiSdk.CurrencyAmount.fromRawAmount(sushiToken0, sushiInputValue1),
                             sushiSdk.TradeType.EXACT_INPUT
                           )
                        const sushiTrade2 =  await new sushiSdk.Trade(
                             new sushiSdk.Route([shushiPair], sushiToken0,sushiToken1),
                             sushiSdk.CurrencyAmount.fromRawAmount(sushiToken0, sushiInputValue2),
                             sushiSdk.TradeType.EXACT_INPUT
                           )
                        let resultValue = {
                            trade: sushiTrade,
                            trade1: sushiTrade1,
                            trade2: sushiTrade2,
                            data: response.data.data.pair
                        }
                           resolve(resultValue)
                    }
                }
            
              }
            })
            .catch(function (error) {
                rejects(error)
            });
        } catch (error) {
            rejects(error)
        }
        
    })

    Promise.all([uniswap,sushiswap]).then((result)=>{
        
        // let diff = result[0].trade.outputAmount.toSignificant(6) - result[1].trade.outputAmount.toSignificant(6);
        // let diff1 = result[0].trade1.outputAmount.toSignificant(6) - result[1].trade1.outputAmount.toSignificant(6);
        // let diff2 = result[0].trade2.outputAmount.toSignificant(6) - result[1].trade2.outputAmount.toSignificant(6);
        

        // let arbitrage = diff/result[0].trade.outputAmount.toSignificant(6)
        
        // let arbitrage1 = diff1/result[0].trade1.outputAmount.toSignificant(6)
        // let arbitrage2 = diff2/result[0].trade2.outputAmount.toSignificant(6)

        // let checkSushiMaximum = [];
        // let checkUniMaximum = [];
        // if(arbitrage >= 5){
        //     checkSushiMaximum.push(arbitrage)
        // }   
        // if(arbitrage1 >= 5){
        //     checkSushiMaximum.push(arbitrage1)
        // }   
        // if(arbitrage2 >= 5){
        //     checkSushiMaximum.push(arbitrage2)
        // }   
        // if(checkSushiMaximum.length > 0 ){
        //     console.log("SYMBOL:",result[0].data.token0.symbol,"/",result[0].data.token1.symbol)
        //     if(checkSushiMaximum.length == 1){
        //         if(checkSushiMaximum[0] === arbitrage) {
        //             console.log("UNISWAP PRICE:",result[0].trade.outputAmount.toSignificant(6))
        //             console.log("SUSHISWAP PRICE:",result[1].trade.outputAmount.toSignificant(6))
        //             console.log("Arbitrage %:",arbitrage)

        //         } else if(checkSushiMaximum[0] === arbitrage1) {
        //             console.log("UNISWAP PRICE 1:",result[0].trade1.outputAmount.toSignificant(6))
        //             console.log("SUSHISWAP PRICE 1:",result[1].trade1.outputAmount.toSignificant(6))
        //             console.log("Arbitrage % 1:",arbitrage1)

        //         } else if(checkSushiMaximum[0] === arbitrage2) {
        //             console.log("UNISWAP PRICE 2:",result[0].trade2.outputAmount.toSignificant(6))
        //             console.log("SUSHISWAP PRICE 2:",result[1].trade2.outputAmount.toSignificant(6))
        //             console.log("Arbitrage % 2:",arbitrage2)
        //         }
        //     } else {
        //         let checksushiMax = Math.max(...checkSushiMaximum)
        //         if(checksushiMax === arbitrage) {
        //             console.log("UNISWAP PRICE:",result[0].trade.outputAmount.toSignificant(6))
        //             console.log("SUSHISWAP PRICE:",result[1].trade.outputAmount.toSignificant(6))
        //             console.log("Arbitrage % :",arbitrage)
        //         } else if(checksushiMax === arbitrage1) {

        //             console.log("UNISWAP PRICE 1:",result[0].trade1.outputAmount.toSignificant(6))
        //             console.log("SUSHISWAP PRICE 1:",result[1].trade1.outputAmount.toSignificant(6))
        //             console.log("Arbitrage % 1:",arbitrage1)

        //         } else if(checksushiMax === arbitrage2) {
        //             console.log("UNISWAP PRICE 2:",result[0].trade2.outputAmount.toSignificant(6))
        //             console.log("SUSHISWAP PRICE 2:",result[1].trade2.outputAmount.toSignificant(6))
        //             console.log("Arbitrage % 2:",arbitrage2)
        //         }
        //     }
        // } else {
        //     if(-5 >= arbitrage){
        //         checkUniMaximum.push(arbitrage)
        //     }   
        //     if(-5 >= arbitrage1){
        //         checkUniMaximum.push(arbitrage1)
        //     }   
        //     if(-5 >= arbitrage2){
        //         checkUniMaximum.push(arbitrage2)
        //     }  

        //     if(checkUniMaximum.length > 0 ){                
        //     console.log("SYMBOL:",result[0].data.token0.symbol,"/",result[0].data.token1.symbol)
        //         if(checkUniMaximum.length == 1){
        //             if(checkUniMaximum[0] === arbitrage) {
        //                 console.log("UNISWAP PRICE:",result[0].trade.outputAmount.toSignificant(6))
        //                 console.log("SUSHISWAP PRICE:",result[1].trade.outputAmount.toSignificant(6))
        //                 console.log("Arbitrage %:",arbitrage)
        //             } else if(checkUniMaximum[0] === arbitrage1) {
        //                 console.log("UNISWAP PRICE 1:",result[0].trade1.outputAmount.toSignificant(6))
        //                 console.log("SUSHISWAP PRICE 1:",result[1].trade1.outputAmount.toSignificant(6))
        //                 console.log("Arbitrage % 1:",arbitrage1)
        //             } else if(checkUniMaximum[0] === arbitrage2) {
        //                 console.log("UNISWAP PRICE 2:",result[0].trade2.outputAmount.toSignificant(6))
        //                 console.log("SUSHISWAP PRICE 2:",result[1].trade2.outputAmount.toSignificant(6))
        //                 console.log("Arbitrage % 2:",arbitrage2)
        //             }
        //         } else {
        //             let checkuniMax = Math.min(...checkUniMaximum)
        //                 if(checkuniMax === arbitrage) {
        //                     console.log("UNISWAP PRICE:",result[0].trade.outputAmount.toSignificant(6))
        //                     console.log("SUSHISWAP PRICE:",result[1].trade.outputAmount.toSignificant(6))
        //                     console.log("Arbitrage %:",arbitrage)
        //                 } else if(checkuniMax === arbitrage1) {
        //                     console.log("UNISWAP PRICE 1:",result[0].trade1.outputAmount.toSignificant(6))
        //                     console.log("SUSHISWAP PRICE 1:",result[1].trade1.outputAmount.toSignificant(6))
        //                     console.log("Arbitrage % 1:",arbitrage1)
        //                 } else if(checkuniMax === arbitrage2) {
        //                     console.log("UNISWAP PRICE 2:",result[0].trade2.outputAmount.toSignificant(6))
        //                     console.log("SUSHISWAP PRICE 2:",result[1].trade2.outputAmount.toSignificant(6))
        //                     console.log("Arbitrage % 2:",arbitrage2)

        //                 }
        //         }
        //     }
        // }

        console.log("SYMBOL:",result[0].data.token0.symbol,"/",result[0].data.token1.symbol)
        console.log("UNISWAP PRICE:",result[0].trade.outputAmount.toSignificant(6))
        console.log("SUSHISWAP PRICE:",result[1].trade.outputAmount.toSignificant(6))
        console.log("UNISWAP PRICE 1:",result[0].trade1.outputAmount.toSignificant(6))
        console.log("SUSHISWAP PRICE 1:",result[1].trade1.outputAmount.toSignificant(6))
        console.log("UNISWAP PRICE 2:",result[0].trade2.outputAmount.toSignificant(6))
        console.log("SUSHISWAP PRICE 2:",result[1].trade2.outputAmount.toSignificant(6))
        // console.log("Arbitrage % 1:",arbitrage)
        // console.log("Arbitrage % 2:",arbitrage1)
        // console.log("Arbitrage % 3:",arbitrage2)
        // console.log("UNISWAP details:",result[0].data)
        // console.log("SUSHISWAP details:",result[1].data)




    })
        
  }



  init()