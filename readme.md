# Alexa Skills Smart lock

This is a simple Alexa Skill which unlock/lock a door using Alexa Skills.

## DynamoDB Table
id name mobile email isOwner

## Following is what it does.
1. Ask Alexa to open the door
2. It will ask for your id. Id is already stored in Dynamo DB. For example: your id is one
3. Alexa skills would pull mobile number using id as parameter
4. Alexa skills would send an OTP on whatsapp using Twilio chat bot
5. User will tell OTP to Alexa
6. Alexa skills would validate the OTP.
7. If it matahes, one MQTT message will be sent to open the door else Admin/Owner will be informed.
8. ESP82266 would be a subscriber to MQTT and It will lock/unlock door as per MQTT message.
9. *****************SMART LOCK********************
