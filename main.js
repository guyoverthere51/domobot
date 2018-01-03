'use strict';

(()=>{

    const chatList = document.getElementById('chat-list');
    const messagesList = document.getElementById('messagesList');

    const sendMessageForm = document.getElementById('send-message-form');
    const sendMessageFormInput = document.getElementById('send-message-form-input');
    const sendMessageButton = document.getElementById('send-message-button');
    // var awsCredentials = new AWS.CognitoIdentityCredentials({
    //         IdentityPoolId: 'us-west-2:some-guid-for-identity-pool-id',
    //         IdentityId: 'us-west-2:some-guid-for-identity-id',
    //         Logins: {
    //             'cognito-identity.amazonaws.com': tokenReturnedFromServer
    //         }
    //     });


    AWS.config.region = 'us-east-1';
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    	IdentityPoolId: 'IDPOOLID',
    });
    let lexruntime = new AWS.LexRuntime();
    let lexUserId = 'chatbot-demo' + Date.now();
    let sessionAttributes = {};
    // sendMessageFormInput.focus();
    window.onload = (event)=>{
        console.log('banana')
        let time = new Date().getHours()
        createMessage('Lexi','face',`Good ${(time < 12 ? 'Morning' : time < 18 ? 'Afternoon' : 'Evening')}! How may I help you today?`)
        sendMessageFormInput.focus()
    }


    sendMessageFormInput.onkeyup = (event)=>{
        if(event.key=='Enter' && sendMessageFormInput.value.trim()!==''){
            pushMessage(sendMessageFormInput.value)
            sendMessageFormInput.value = ''
            sendMessageFormInput.focus()
        }
    }
    sendMessageButton.onclick = (event)=>{
        if(sendMessageFormInput.value.trim()!==''){
            pushMessage(sendMessageFormInput.value)
            sendMessageFormInput.value = ''
            sendMessageFormInput.focus()
        }
    }

    function pushMessage(value,next) {
        let params = {
            botAlias: '$LATEST',
            botName: 'domo',
            inputText: value,
            userId: lexUserId,
            sessionAttributes: sessionAttributes
        };

        showRequest(value);
        lexruntime.postText(params, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                showError('Error:  ' + err.message + ' (see console for details)')
            }
            if (data) {
                sessionAttributes = data.sessionAttributes;
                showResponse(data);
            }
            next && next()
        });

        return false;
    }

    function showRequest(value){
        createMessage('you','person',value)
    }

    function showResponse(response){
        let { dialogState,slots,message,responseCard } = response

        createMessage('Lexi','face',message)
        if(responseCard!==undefined){
            createResponseCard(responseCard)
        }
        if(dialogState==='Fulfilled'){
            console.log('extracted from conversation',slots)
        }else if(dialogState==='Failed'){
            console.log('appointment not scheduled',slots)
        }
	}

    function createMessage(entity,avatar,value){
        let d = new Date();
        let s = d.getSeconds()<10 ? `0${d.getSeconds()}` : d.getSeconds();
        let m = d.getMinutes()<10 ? `0${d.getMinutes()}` : d.getMinutes();
        let h = d.getHours();
        let a = d.getHours() >= 12 ? 'pm' : 'am';

        let listItem = document.createElement('li');
        let mainSpan = document.createElement('span')
        let icon = document.createElement('i');
        let user = document.createElement('span');
        let message = document.createElement('span');
        let date = document.createElement('span')

        let spacer = document.createElement('div');
        spacer.className = 'mdl-layout-spacer'

        listItem.className = 'mdl-list__item mdl-list__item--three-line';
        mainSpan.className = 'mdl-list__item-primary-content'
        icon.className = 'material-icons mdl-list__item-avatar';
        icon.innerText = avatar;
        user.innerText = entity;
        message.className = 'mdl-list__item-text-body';
        message.innerText = value;
        date.className = ''
        date.innerText = `${h}:${m}${a}`
        date.style.float = 'right';


        mainSpan.append(icon)
        mainSpan.append(user)
        mainSpan.append(date)
        mainSpan.append(message)
        listItem.append(mainSpan)

        messagesList.append(listItem)

        scrollTo(chatList,chatList.scrollHeight,200)
    }

    function createResponseCard(data){

        let cardTitle = data.genericAttachments[0].title;
        let cardSubTitle = data.genericAttachments[0].subTitle;
        let cardButtons = data.genericAttachments[0].buttons;
        let cardImage = data.genericAttachments[0].imageUrl;

        let listItem = document.createElement('li');
        let card = document.createElement('div');
        let cardTitleDiv = document.createElement('div');
        let cardTitleText = document.createElement('h2');
        let cardSubTitleDiv = document.createElement('div');
        let cardActionsDiv = responseCardActions(cardButtons);


        listItem.className = 'mdl-list__item';

        card.className = 'demo-card-wide mdl-card mdl-shadow--2dp chatResponseCard';
        cardTitleDiv.className = 'mdl-card__title';
        cardTitleText.className = 'mdl-card__title-text';
        cardSubTitleDiv.className = 'mdl-card__supporting-text';
        cardActionsDiv.className = 'mdl-card__actions mdl-card--border'

        cardTitleText.innerText = cardTitle;
        cardTitleText.style.color = 'white'
        cardTitleDiv.append(cardTitleText);
        cardTitleDiv.style.backgroundColor = '#00BCD4'

        cardSubTitleDiv.innerText = cardSubTitle

        card.append(cardTitleDiv)
        card.append(cardSubTitleDiv)
        card.append(cardActionsDiv)
        listItem.append(card)

        messagesList.append(listItem)

    }

    function responseCardActions(buttons){
        let actionsDiv = document.createElement('div');
        buttons
            .map(c=>{
                let actionButton = document.createElement('button');
                let actionButtonTitle = document.createElement('span');
                actionButton.className = 'mdl-chip chatResponseCardActionbutton'
                actionButtonTitle.className = 'mdl-chip__text'
                actionButtonTitle.innerText = c.text
                actionButton.value = c.value
                actionButton.onclick = (event)=>{
                    pushMessage(c.text,()=>{

                        actionButton.style.backgroundColor = '#006064'
                        actionButtonTitle.style.color = 'white'
                        sendMessageFormInput.focus()
                        actionsDiv.style.pointerEvents = 'none'
                     })
                }
                actionButton.append(actionButtonTitle)
                return actionButton

            })
            .forEach(c=>{
                actionsDiv.append(c)
            })

        return actionsDiv
    }


    function scrollTo(element, to, duration) {
        let start = element.scrollTop,
            change = to - start,
            currentTime = 0,
            increment = 20;

        let animateScroll = function(){
            currentTime += increment;
            let val = easinoutquad(currentTime, start, change, duration);
            element.scrollTop = val;
            if(currentTime < duration) {
                setTimeout(animateScroll, increment,100);
            }
        };
        animateScroll();
        function easinoutquad(current,start,change,duration){
            current /= duration/2;
            if(current < 1) return change/2*current*current + start;
            current --;
            return -change/2 * (current*(current-2)-1)+start
        }
    }

    function sscrollTo(startY,stopY){

        var rawdist = stopY-startY;

        var distance = rawdist>0?rawdist:-rawdist;
        if (distance < 100) {
            scrollTo(0, stopY); return;
        }

        var speed = Math.round(distance / 100);
        if (speed >= 20) speed = 10;

        var step = Math.round(distance / 25);
        var jump = rawdist>0?startY+step:startY-step;

        var timer = 0;
        if(rawdist>0) {
            for (var i = startY;i<stopY;i+=step){
                setTimeout("window.scrollTo(0, "+jump+")", timer * speed);
                jump += step;
                if (jump > stopY) jump = stopY;
                timer++;
            }
            return;
        }

        for(var i=startY;i>stopY;i-=step){
            setTimeout("window.scrollTo(0, "+jump+")", timer * speed);
            jump -= step;
            if(jump<stopY) jump = stopY;
            timer++;
        }
    }
})()
