/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const dbHelper = require('./helpers/dbHelper');
const twilioHelper = require('./helpers/helpertwilio');
const helperdb = require('./helpers/helperdb');
const mqttHelper = require('./helpers/mqtthelper');
const GENERAL_REPROMPT = "What would you like to do?";
const dynamoDBTableName = "dynamodb-starter";

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = 'Hello there. You can ask me to open or close the door.';
    const repromptText = 'What would you like to do? You can say HELP to get available options or you can say, Khul ja sim sim';
    console.log("I am working and called in launch request...")
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};


const UnlockDoorIntentHandler = {
  canHandle(handlerInput) {
    console.log("Unlock Door Intent is called in can handle...")
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'UnlockDoorIntent';
  },
  handle(handlerInput) {
    const speechText = 'Please tell me your id';
    const speechTextAlarm = `
    <speak>
    Tell me your id now.
    <amazon:effect name="whispered"> Else, I will raise an alarm</amazon:effect>.
    <emphasis>Did you get me?</emphasis>
    </speak>
    `;
    console.log("Unlock Door Intent is called in handle...");
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechTextAlarm)
      .getResponse();
  }
}

const LockDoorIntentHandler = {
  canHandle(handlerInput) {
    console.log("Lock Door Intent is called in can handle...")
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'LockDoorIntent';
  },
  async handle(handlerInput) {
    var speechText = 'Sure closing the door';
    console.log("Lock Door Intent is called in handle...");
    return mqttHelper.doorCommand('close')
    .then((data) => {
      if (data.success === 'door closed') {
        console.log("MQTT message successfully delivered for closing door.")
        console.log(handlerInput.responseBuilder);
       
        return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
      }
      else {
        speechText = 'Error while sending MQTT for closing the door'
        return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
      }

    })
    .catch((err) => {
      speechText = "Unable to send values to MQTT for closing door.";
      return handlerInput.responseBuilder
        .speak(speechText)
        .getResponse();
    })
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechTextAlarm)
      .getResponse();
  }
}


const GenerateAndSendOTPIntentHandler = {
  canHandle(handlerInput) {
    console.log("Generate OTP Intent is called in can handle...")
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'GenerateAndSendOTPIntent';
  },
  async handle(handlerInput) {
    var id = handlerInput.requestEnvelope.request.intent.slots.id.value;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.id = id;

    return helperdb.generateAndSendOTP(parseInt(id))
      .then((data) => {
        var name = data.name;
        var mobile = data.mobile;
        var otp = data.otp;
        //Send OTP on whatsApp using Twilio
        twilioHelper.sendOTPtoWhatsApp(otp, mobile, name);
        const speechText = '<speak>I have sent the OTP on your mobile. <emphasis>Please tell me the OTP</emphasis></speak>';
        const speechTextAlarm = `
           <speak>
             <emphasis>Please tell me the OTP</emphasis>
           </speak>
           `;
        console.log("Generate OTP Intent is called in handle...");
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(speechTextAlarm)
          .getResponse();

      })
      .catch((err) => {
        speechText = "Unable to fetch values from database.";
        return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
      })


  }
}

const ValidateOTPIntentHandler = {
  canHandle(handlerInput) {
    console.log("Validate OTP Intent is called in can handle...")
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'ValidateOTPIntent';
  },
  async handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var id = sessionAttributes.id;
    console.log("*****************");
    console.log(id);
    console.log("*****************");

    var otp = handlerInput.requestEnvelope.request.intent.slots.otp.value;
    return helperdb.validateOTP(parseInt(id), parseInt(otp))
      .then((data) => {
        if (data.success === "success") {
          console.log("Inside if....OTP validation is successful");
          //Send OTP on whatsApp using Twilio
          //twilioHelper.sendOTPtoWhatsApp(otp, mobile, name); 
          return mqttHelper.doorCommand('open')
            .then((data) => {
              if (data.success === 'door opened') {
                console.log("MQTT message successfully delivered.")
                console.log(handlerInput.responseBuilder);
                var speechText = '<speak>Opening door.  <emphasis>Informing the owner.</emphasis></speak>';

                return handlerInput.responseBuilder
                  .speak(speechText)
                  .getResponse();
              }
              else {
                var speechText = 'Error while sending MQTT'
                return handlerInput.responseBuilder
                  .speak(speechText)
                  .getResponse();
              }

            })
            .catch((err) => {
              speechText = "Unable to send values to MQTT.";
              return handlerInput.responseBuilder
                .speak(speechText)
                .getResponse();
            })
        }
        else {
          const speechText = '<speak>OTP validation failed.</speak>';

          console.log("Inside else condition in handle...");
          return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();

        }

      })
      .catch((err) => {
        console.log("This is not working " + err)
        speechText = "Unable to fetch values from database.";
        return handlerInput.responseBuilder
          .speak(speechText)
          .getResponse();
      })
    
  }



}


const InProgressAddMovieIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AddMovieIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const AddMovieIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AddMovieIntent';
  },
  async handle(handlerInput) {
    const { responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const movieName = slots.MovieName.value;
    return dbHelper.addMovie(movieName, userID)
      .then((data) => {
        const speechText = `You have added movie ${movieName}. You can say add to add another one or remove to remove movie`;
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        console.log("Error occured while saving movie", err);
        const speechText = "we cannot save your movie right now. Try again!"
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  },
};

const GetMoviesIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'GetMoviesIntent';
  },
  async handle(handlerInput) {
    const { responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId;
    return dbHelper.getMovies(userID)
      .then((data) => {
        var speechText = "Your movies are "
        if (data.length == 0) {
          speechText = "You do not have any favourite movie yet, add movie by saving add moviename "
        } else {
          speechText += data.map(e => e.movieTitle).join(", ")
        }
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = "we cannot get your movie right now. Try again!"
        return responseBuilder
          .speak(speechText)
          .getResponse();
      })
  }
}

const InProgressRemoveMovieIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'RemoveMovieIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  }
}

const RemoveMovieIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RemoveMovieIntent';
  },
  handle(handlerInput) {
    const { responseBuilder } = handlerInput;
    const userID = handlerInput.requestEnvelope.context.System.user.userId;
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const movieName = slots.MovieName.value;
    return dbHelper.removeMovie(movieName, userID)
      .then((data) => {
        const speechText = `You have removed movie with name ${movieName}, you can add another one by saying add`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
      .catch((err) => {
        const speechText = `You do not have movie with name ${movieName}, you can add it by saying add`
        return responseBuilder
          .speak(speechText)
          .reprompt(GENERAL_REPROMPT)
          .getResponse();
      })
  }
}

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can introduce yourself by telling me your name';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    UnlockDoorIntentHandler,
    LockDoorIntentHandler,
    GenerateAndSendOTPIntentHandler,
    ValidateOTPIntentHandler,
    InProgressAddMovieIntentHandler,
    AddMovieIntentHandler,
    GetMoviesIntentHandler,
    InProgressRemoveMovieIntentHandler,
    RemoveMovieIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(dynamoDBTableName)
  .withAutoCreateTable(true)
  .lambda();
