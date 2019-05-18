#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_NeoPixel.h>
#include <Servo.h>


Servo myservo;  // create servo object to control a servo
// twelve servo objects can be created on most boards

int pos = 0;    // variable to store the servo position

#ifdef __AVR__
#include <avr/power.h> // Required for 16 MHz Adafruit Trinket
#endif

// Which pin on the Arduino is connected to the NeoPixels?
#define PIN 5 // On Trinket or Gemma, suggest changing this to 1

// How many NeoPixels are attached to the Arduino?
#define NUMPIXELS 16 // Popular NeoPixel ring size

// When setting up the NeoPixel library, we tell it how many pixels,
// and which pin to use to send signals. Note that for older NeoPixel
// strips you might need to change the third parameter -- see the
// strandtest example for more information on possible values.
Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

#define DELAYVAL 250 // Time (in milliseconds) to pause between pixels

// Update these with values suitable for your network.

const char *ssid = "";
const char *password = "";
const char *mqtt_server = "postman.cloudmqtt.com";
const char *mqttUser = "";
const char *mqttPassword = "";
uint16_t port = 18744;

WiFiClient espClient;
PubSubClient client(espClient);
long lastMsg = 0;
//char msg[50];
const char *keepAliveMsg = "Alive-ESP1";
int value = 0;

void controlLED(char event)
{
  Serial.println("Entering Control LED");
  Serial.println(event);
  uint32_t r = 0;
  uint32_t g = 0;
  uint32_t b = 0;
  switch (event)
  {
  case 'W' /* Wi-Fi Connected */:
    /* code */
    r = 255;
    g = 255;
    b = 255;
    break;
  case 'O' /* Door Open */:
    /* code */
    r = 0;
    g = 200;
    b = 0;
    break;
  case 'C' /* constant-expression */:
    /* code */
    r = 255;
    g = 0;
    b = 0;
    break;
  default:
    break;
  }
  
  pixels.clear(); // Set all pixel colors to 'off'

  // The first NeoPixel in a strand is #0, second is 1, all the way up
  // to the count of pixels minus one.
  for (int i = 0; i < NUMPIXELS; i++)
  { // For each pixel...

    // pixels.Color() takes RGB values, from 0,0,0 up to 255,255,255
    // Here we're using a moderately bright green color:
    pixels.setPixelColor(i, pixels.Color(r, g, b));

    pixels.show(); // Send the updated pixel colors to the hardware.
    delay(DELAYVAL);    
  }
  pixels.clear();
  pixels.show();
}

 void controlLock(char event){
   switch (event)
   {
   case 'O'/* Open Lock */:
     myservo.write(0);
     break;
   case 'C'/* Close Lock */:
     myservo.write(90);
     break;
   default:
     myservo.write(0);
     break;
   }
  
  
 }

void setup_wifi()
{

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  controlLED('W');
}



void callback(char *topic, byte *payload, unsigned int length)
{
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; (unsigned)i < length; i++)
  {
    Serial.print((char)payload[i]);
  }
  Serial.println();

  // Switch on the LED if an 1 was received as first character
  if ((char)payload[0] == '1')
  {
    controlLED('O');
    controlLock('O');
  }
  else
  {
    controlLED('C');
    controlLock('C');
  }
}

void reconnect()
{
  // Loop until we're reconnected
  while (!client.connected())
  {
    Serial.print("Attempting MQTT connection...");
    // Create a random client ID
    String clientId = "ESP8266Client";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str(), mqttUser, mqttPassword))
    {
      Serial.println("connected");
      // Once connected, publish an announcement...
      //client.publish("door", "door opened by ESP");
      // ... and resubscribe
      client.subscribe("door");
    }
    else
    {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup()
{
// These lines are specifically to support the Adafruit Trinket 5V 16 MHz.
// Any other board, you can remove this part (but no harm leaving it):
#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)
  clock_prescale_set(clock_div_1);
#endif
  // END of Trinket-specific code.
  Serial.begin(115200);
  pixels.begin(); // INITIALIZE NeoPixel strip object (REQUIRED)
  myservo.attach(4);
  myservo.write(90);
  setup_wifi();
  client.setServer(mqtt_server, port);
  client.setCallback(callback);
}

void loop()
{
  
  if (!client.connected())
  {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 20000)
  {
    lastMsg = now;
    ++value;
    // snprintf (msg, 50, "true #%ld", value);
    Serial.print("Publish message: ");
    client.publish("keepAlive", keepAliveMsg);
  }
}
