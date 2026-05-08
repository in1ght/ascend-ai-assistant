require(`dotenv`).config();
const { tool } = require("langchain");
const { z } = require("zod");
const { google } = require("googleapis"); 
const calendar = google.calendar("v3"); 

const createCalendar = async (auth, summary, timeZone = "Europe/London") => { 
  const res = await calendar.calendars.insert({ 
    auth, 
    requestBody: { 
      summary, 
      timeZone, 
    }, 
  }); 

  return res.data; 
}; 


const createCalendarEvent = (calendarID, description, location, summary, startDate, endDate) => {
    // TimeZone -> by ip or just auto to Europe
    var timeZone = `Europe/London`;
    // create start date/time
    // var startDate = `2026-04-30T13:00:00.000`;
    // var endDate = `2021-04-30T14:00:00.000`;
    var start = {
        dateTime: startDate,
        timeZone: timeZone
    };
    var end = {
        dateTime: endDate,
        timeZone: timeZone
    };

    // // add attendees - repeat as necessary to add more
    // var attendees = [
    //     {email: `example1@example.com`},
    //     {email: `example2@example.com`}
    // ];

    // AUTO
    var sendUpdates = `all`;
    var guestsCanInviteOthers = false;
    var guestsCanModify = true;
    var guestsCanSeeOtherGuests = false;
    var transparency = `opaque`; // `transparent` = Available // `opaque` = Busy
    var visibility = `default`;

    // compile all of the above options for the event
    var resource = {
        summary,
        description,
        start,
        end,
        conferenceData,
        attendees,
        location,
        guestsCanInviteOthers,
        guestsCanModify,
        guestsCanSeeOtherGuests,
        transparency,
        visibility
    };
    var args = {
        conferenceDataVersion: 1,
        sendUpdates
    };

    // make call to Calendar API to create event
    var request = Calendar.Events.insert(resource, calendarID, args);

    // const newCal = await createCalendar(auth, "My App Calendar"); // AI
    // const calendarID = newCal.id; // AI

    // createCalendarEvent(calendarID, ...); // existing

    // capture event ID and log it
    var eventID = request.id;
    Logger.log(`Created Event: ` + eventID);

    // capture event HTML link and log it
    var eventHTML = request.htmlLink;
    Logger.log(`Event HTML Link is: ` + eventHTML);
}


const getWeather = tool(
  (input) => createCalendarEvent(input),
  {
    name: "get_weather",
    description:`
    Create a calendar event. Requires a title and description. 
    Use when the user wants to schedule or add an event. 
    Time is automatically taken from the text.
    Retunr success or faulty message.`,
    schema: z.object({
    name: z.string().describe(`Title of the event, under 10 words, short and concise.`),
    description: z.string().describe(`Details about the event, under 200 words.`),
  })
  }
);

module.exports = { getWeather };