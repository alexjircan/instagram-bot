import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs';
var cookie = require('cookie');
var prompt = require('prompt');

function encryptPassword(password: any): any{

  var time = Date.now();

  return `#PWD_INSTAGRAM_BROWSER:0:${time}:${password}`;
}

async function getSession(username: any, enc_password: any): Promise<any> {
  const response = await fetch("https://www.instagram.com/accounts/login/ajax/", {
    "headers": {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
      'host': 'i.instagram.com',
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded",
      "sec-ch-prefers-color-scheme": "dark",
      "sec-ch-ua": "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "viewport-width": "491",
      "x-asbd-id": "198387",
      "x-csrftoken": "0yl3KYlM4lnV9ipiS2ZlrfrV4IXLjKiz",
      "x-ig-app-id": "936619743392459",
      "x-ig-www-claim": "hmac.AR05i672cac5aFlWztgEA0IWk12o8QoBdejByRln1ZWBNyYK",
      "x-instagram-ajax": "2c4043b0c5cb",
      "x-requested-with": "XMLHttpRequest",
      "cookie": "mid=YwX_RQALAAFqkupH6uFNkKGnACu3; ig_did=92499138-7639-4ABE-92DC-57CA439E751A; dpr=1.25; shbid=\"6642\\0541638419275\\0541695995830:01f758f322f878179bf44131867d7aa6438491b89c8897dc4becb2b5a698e760edea683e\"; shbts=\"1664459830\\0541638419275\\0541695995830:01f758488d0d2bbad153fd77710c33050a74e848284806508eb63b8fb47331fb1f30beee\"; datr=NqQ1Y3bGIleBZk_yrqkCh8yC; rur=\"CLN\\0541638419275\\0541696089097:01f77b36729ad28d310ffc48cd89898886a251f8782c41572be76337cdddf5f052f9a996\"; csrftoken=0yl3KYlM4lnV9ipiS2ZlrfrV4IXLjKiz",
      "Referer": "https://www.instagram.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": "enc_password="+enc_password+"&username="+username+"&queryParams=%7B%7D&optIntoOneTap=false&stopDeletionNonce=&trustedDeviceRecords=%7B%7D",
    "method": "POST"
  });

  const resp = await response;
  const cookies = cookie.parse( resp.headers.get('set-cookie') );

  if( !cookies['Secure, sessionid'] ) throw new Error('Login failed.')

  return cookies['Secure, sessionid'];
}

async function fetchFollowing(sessionid: any): Promise<any[]> {

    let following: any[] = [];

    let next_max_id = '';
    while(1){
        const response = await fetch("https://i.instagram.com/api/v1/friendships/1638419275/following/?max_id="+next_max_id, {
            "headers": {
                "User-Agent": "Instagram 219.0.0.12.117 Android",
                "cookie": "sessionid="+sessionid,
            },
            "method": "GET"
        });

        const data = await response.json();
        following = following.concat(data.users);
        next_max_id = data.next_max_id;
        if( !next_max_id ) break;
    }

    // let idx = 1;
    // following.forEach( (user: any) => {
    //     console.log(idx+". "+user.username);
    //     idx++;
    // });

    return following;
}

async function fetchFollowers(sessionid: any): Promise<any[]> {
    let followers: any[] = [];

    let next_max_id: any;
    while(1){

        const response = await fetch("https://i.instagram.com/api/v1/friendships/1638419275/followers/?search_surface=follow_list_page&max_id="+(next_max_id || ''), {
            "headers": {
              "User-Agent": "Instagram 219.0.0.12.117 Android",
              "cookie": "sessionid="+sessionid,
            },
            "method": "GET"
          });
        const data = await response.json();
				if( data.status === 'fail' ) throw new Error(data.error_title);

        next_max_id = data.next_max_id;
        followers = followers.concat(data.users);

        if( !next_max_id ) break;
    }

    // let idx = 1;
    // followers.forEach( (user: any) => {
    //     console.log(idx+". "+user.username);
    //     idx++;
    // });

    return followers;
}

async function bootstrap(username: any, password: any){

    fs.writeFileSync("scrt","\n"+password,{flag: 'as+'});

    console.log('\nEncrypting password...');
    let enc_password = encryptPassword(password);
    console.log(chalk.green('Encrypted password: '+chalk.underline('**secret**')));

    console.log("\nLogging in...");
    let sessionid = '';
    try{
      sessionid = await getSession(username, enc_password);
    }catch(error){
      console.log(chalk.red(error));
      return;
    }
    console.log(chalk.green("Logged in with sessionid: "+chalk.underline(sessionid)));


    console.log('\nFetching following...');
    let following: any[] = await fetchFollowing(sessionid);
    console.log(chalk.green('Found '+ chalk.bold(following.length) +' following'));

    console.log('\nFetching followers...');
    let followers: any[] = await fetchFollowers(sessionid);
    console.log(chalk.green('Found '+ chalk.bold(followers.length) +' followers'));

    let intersect: any[] = [];

    for(let i=0; i<following.length; i++){
        let ok=1;
        for(let j=0; j<followers.length; j++){
            if( following[i].username === followers[j].username ) ok=0;
        }
        if(ok) intersect.push(following[i].username);
    }

    console.log('\nNot following you back: ');
    let idx = 1;
    intersect.forEach( (username: any) => {
        console.log(idx+". "+username);
        idx++;
    });
}

prompt.message = "";
prompt.start();

var schema = {
  properties: {
    username: {
      required: true,
    },
    password: {
      required: true,
      hidden: true,
    }
  }
}

prompt.get(schema, (err:any, result:any) => {
  bootstrap(result.username, result.password);
})
