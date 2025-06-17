const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/eventDashboard', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });mongodb+srv://parthipancseai:q4hGxzOs5nSW6ns2@db.gvn7lje.mongodb.net/

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));


// Event Schema
// Event Schema
const eventSchema = new mongoose.Schema({
  teamCode: String,
  parameter: String,
  date: Number,
  month: String,
  year: Number,
  eventDetails: String,
  participants: [{
    name: String,
    email: String
  }],
  startups: [{
    name: String,
    founder: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Summary Schema
const summarySchema = new mongoose.Schema({
  teamCode: String,
  parameter: String,
  period: String, // e.g. "Jul24"
  count: Number,
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }]
});

const Event = mongoose.model('Event', eventSchema);
const Summary = mongoose.model('Summary', summarySchema);

// API Endpoints
app.post('/api/events', async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      participants: req.body.participants || [],
      startups: req.body.startups || []
    });
    await event.save();
    
    // Update summary
    const period = `${req.body.month.substring(0, 3)}${req.body.year.toString().substring(2)}`;
    let summary = await Summary.findOne({ teamCode: req.body.teamCode, period });
    
    if (!summary) {
      summary = new Summary({
        teamCode: req.body.teamCode,
        parameter: sectionsData[req.body.teamCode],
        period,
        count: 0,
        events: []
      });
    }
    
    summary.count += 1;
    summary.events.push(event._id);
    await summary.save();
    
    res.status(201).send(event);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get('/api/summaries', async (req, res) => {
  try {
    const summaries = await Summary.find();
    res.send(summaries);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/api/events/:period/:teamCode', async (req, res) => {
  try {
    const summary = await Summary.findOne({
      period: req.params.period,
      teamCode: req.params.teamCode
    }).populate('events');
    
    if (!summary) {
      return res.status(404).send();
    }
    
    res.send(summary.events);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { date, month, year, eventDetails } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    const oldPeriod = `${event.month.substring(0, 3)}${event.year.toString().slice(-2)}`;
    const newPeriod = `${month.substring(0, 3)}${year.toString().slice(-2)}`;
    const teamCode = event.teamCode;

    // Update event fields
    event.date = date;
    event.month = month;
    event.year = year;
    event.eventDetails = eventDetails;
    await event.save();

    // Only move between summaries if the period changed
    if (oldPeriod !== newPeriod) {
      // Remove from old summary
      const oldSummary = await Summary.findOne({ teamCode, period: oldPeriod });
      if (oldSummary) {
        oldSummary.events.pull(event._id);
        oldSummary.count = Math.max(0, oldSummary.count - 1);
        await oldSummary.save();
      }

      // Add to new summary
      let newSummary = await Summary.findOne({ teamCode, period: newPeriod });
      if (!newSummary) {
        newSummary = new Summary({
          teamCode,
          parameter: sectionsData[teamCode],
          period: newPeriod,
          count: 0,
          events: []
        });
      }

      newSummary.events.push(event._id);
      newSummary.count += 1;
      await newSummary.save();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).send(err.message);
  }
});


app.delete('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    await Event.deleteOne({ _id: event._id });

    const period = `${event.month.substring(0, 3)}${event.year.toString().slice(-2)}`; // e.g., "Jul24"
    const summary = await Summary.findOne({ teamCode: event.teamCode, period });

if (!summary) {
  console.warn(`Summary not found for teamCode=${event.teamCode} and period=${period}`);
} else {
  summary.count = Math.max(0, summary.count - 1);
  summary.events.pull(event._id);

  // ✅ Remove entire summary document if count is 0
  if (summary.count === 0) {
    await summary.deleteOne();
    console.log(`Summary for ${event.teamCode} - ${period} deleted (no events left).`);
  } else {
    await summary.save();
  }
}


    res.sendStatus(200);
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).send(err.message);
  }
});


app.get('/api/summaries/extended', async (req, res) => {
  try {
    const summaries = await Summary.find().populate('events');

    const result = summaries.map(summary => {
      const entrepreneurs = summary.events.reduce((acc, ev) => acc + (ev.participants?.length || 0), 0);
      const startups = summary.events.reduce((acc, ev) => acc + (ev.startups?.length || 0), 0);
      return {
        teamCode: summary.teamCode,
        parameter: summary.parameter,
        period: summary.period,
        eventCount: summary.count,
        entrepreneurs,
        startups
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Fallback routes to serve HTML files directly
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/event2.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'event2.html')));
app.get('/main.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'main.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));

//mongodb+srv://parthipancseai:q4hGxzOs5nSW6ns2@db.gvn7lje.mongodb.net/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Data mapping
const sectionsData = {
  A1: "No of Outreach / Promotion",
  A2: "No of Training / Mentorship Programs",
  A3: "Direct Ecosystem Engagement Events (Pitch Fest, Contests, Hackathons, Talks)",
  A4: "Other Activities/Tasks (e.g., Infra, MoUs, Events)",
  B1: "No. of Startups to be Incubated",
  B2: "No. of Startups to be Accelerated",
  B3: "Cumulative No. of IPs Created by Startups",
  B4: "Cumulative No. of Products Created/Launched",
  B5: "Cumulative No. of Prototypes Showcased",
  C1: "Entrepreneurs benefitted (A1+A2+A3)",
  C2: "Startups Supported (A1+A2+A3)",
  C3: "Community Engagement Events",
  C4: "Deep tech and Emerging Tech investors",
  C5: "MoUs with Colleges for JIGSAW Platform",
  C6: "Researchers onboarded onto JIGSAW Platform",
  C7: "EoIs with international ecosystem players",
  C8: "MoUs with Ecosystem Enablers (Industry, incubators etc)",
  C9: "Product Launches"
};