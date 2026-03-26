// ═══════════════════════════════════════════════════════════════
// FLORA ET LABORA — GOOGLE APPS SCRIPT
// Booking Log (Google Sheet) + Auto Calendar Events
// ═══════════════════════════════════════════════════════════════
//
// SETUP INSTRUCTIONS:
//
// 1. Go to https://script.google.com → New Project
// 2. Name it "Flora Bookings"
// 3. Delete the default code → paste this entire file
// 4. Update SHEET_ID and CALENDAR_ID below
// 5. Click Deploy → New Deployment → Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
//    → Click Deploy → Authorize (allow all permissions)
//    → Copy the Web App URL
// 6. Paste that URL into flora.html:
//    var BOOKING_SCRIPT_URL = 'https://script.google.com/macros/s/xxxxx/exec';
//
// GOOGLE SHEET SETUP:
// 1. Create a new Google Sheet
// 2. Name the first tab "Prenotazioni"
// 3. Add headers in Row 1:
//    Timestamp | Nome | Email | Telefono | Tipo | Persone | Data/Ora | Torta | Note | Calendario
// 4. Copy the Sheet ID from the URL:
//    https://docs.google.com/spreadsheets/d/{THIS_IS_THE_SHEET_ID}/edit
// 5. Paste it below
//
// GOOGLE CALENDAR SETUP:
// 1. Use the client's primary calendar OR create a new one called "Flora Prenotazioni"
// 2. For primary calendar: CALENDAR_ID = 'floraetlaboramilano@gmail.com'
// 3. For a separate calendar: Settings → Calendar ID (looks like xxx@group.calendar.google.com)
//
// ═══════════════════════════════════════════════════════════════

var SHEET_ID = '';    // <-- PASTE GOOGLE SHEET ID HERE
var CALENDAR_ID = 'floraetlaboramilano@gmail.com'; // or a separate calendar ID

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 1. Log to Google Sheet
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Prenotazioni');
    if (!sheet) {
      sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    }

    var calendarStatus = 'No';

    // 2. Create Google Calendar event if date_time is provided
    if (data.date_time && data.date_time !== 'Non specificato') {
      try {
        var eventDate = new Date(data.date_time);

        // Create 1.5 hour event by default
        var endDate = new Date(eventDate.getTime() + 90 * 60 * 1000);

        var title = 'Prenotazione ' + (data.booking_type || '') + ' — ' + (data.from_name || 'Ospite');

        var description = 'Nome: ' + (data.from_name || '') + '\n'
          + 'Email: ' + (data.reply_to || '') + '\n'
          + 'Telefono: ' + (data.phone || '') + '\n'
          + 'Tipo: ' + (data.booking_type || '') + '\n'
          + 'Persone: ' + (data.guests || '') + '\n'
          + 'Torta: ' + (data.cake || 'No') + '\n'
          + 'Note: ' + (data.message || 'Nessuna nota');

        var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
        if (calendar) {
          calendar.createEvent(title, eventDate, endDate, {
            description: description,
            location: 'Flora et Labora, Alzaia Naviglio Pavese 20, 20143 Milano'
          });
          calendarStatus = 'Si';
        }
      } catch (calErr) {
        calendarStatus = 'Errore: ' + calErr.message;
      }
    }

    // Append row to sheet
    sheet.appendRow([
      new Date(),                    // Timestamp
      data.from_name || '',          // Nome
      data.reply_to || '',           // Email
      data.phone || '',              // Telefono
      data.booking_type || '',       // Tipo
      data.guests || '',             // Persone
      data.date_time || '',          // Data/Ora
      data.cake || 'No',             // Torta
      data.message || '',            // Note
      calendarStatus                 // Calendario
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok', calendar: calendarStatus })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this manually to verify Sheet + Calendar access
function testBooking() {
  var testEvent = {
    postData: {
      contents: JSON.stringify({
        from_name: 'Test Flora',
        reply_to: 'test@example.com',
        phone: '+39 333 000 0000',
        booking_type: 'aperitivo',
        guests: '4',
        date_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // tomorrow
        cake: 'No',
        message: 'Test prenotazione automatica'
      })
    }
  };
  var result = doPost(testEvent);
  Logger.log(result.getContent());
}
