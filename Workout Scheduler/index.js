// A single part of an exercise
class Step
{
  constructor(name, duration)
  {
    this.name = name;
    this.duration = duration;
  }
}

// A single repetition of an exercise
class Exercise
{
  constructor(name = "", steps = [])
  {
    this.name = name;
    this.steps = steps;
  }
}

// A timestep and a string
class Cue
{
  constructor(time, message, duration, isExercise = false)
  {
    this.time = time;
    this.message = message;
    this.duration = duration;
    this.isExercise = isExercise;
  }
}

class Schedule
{
  constructor(exerciseIdx, reps)
  {
    this.exerciseIdx = exerciseIdx;
    this.reps = reps;
  }
}

class Workout
{
  constructor(exercises = [], schedule = [])
  {
    this.exercises = exercises;
    this.schedule = schedule;
  }

  Parse(data)
  {
    // Parse exercises
    let exercises = data.exercises;
    for (let e of exercises)
    {
      this.exercises.push(Object.assign(new Exercise(), e));
    }

    // Parse schedule
    let schedule = data.schedule;
    for (let s of schedule)
    {
      // Find exerciseIdx from name
      let exerciseIdx = -1;

      for (let e = 0; e < this.exercises.length; ++e)
      {
        if (this.exercises[e].name == s.exercise)
        {
          exerciseIdx = e;
          break;
        }
      }

      if (exerciseIdx == -1)
      {
        console.error("Faield to parse workout file. ", s.exercise, " is not a vaild name.");
        // TODO(JF): Throw an error here
      }

      let schedule = new Schedule(exerciseIdx, s.reps);

      this.schedule.push(schedule);
    }
  }
}

const consts =
{
  exerciseNameTime: 2,
};

let ui =
{
  startButton: null,
  currentExercise: null
};

let cues = [];
window.onload = async function()
{
  // NOTE(JF): This might not work locally, will need to run a server
  let workoutResponse = await fetch('exampleWorkout.json');
  let workoutData = await workoutResponse.json();

  let workout = new Workout();
  workout.Parse(workoutData);
  console.log(workout);

  ui.startButton = document.getElementById('start');
  ui.startButton.onclick = () =>
  {
    window.requestAnimationFrame(step);
  };

  ui.currentExercise = document.getElementById('current');

  // Parse workout into cues
  let totalTime = 0;
  // For every schedule in the workout
  for (let s of workout.schedule)
  {
    // Get the actual exercise
    let exercise = workout.exercises[s.exerciseIdx];

    // For each new exercise add a cue for the name of it
    cues.push(new Cue(totalTime, `${exercise.name} times ${s.reps}`, consts.exerciseNameTime, true));
    totalTime += consts.exerciseNameTime;

    // For each rep in the schedule
    for (let i = 0; i < s.reps; ++i)
    {
      // For each step of the exercise
      for (let step of exercise.steps)
      {
        // Add the cue
        cues.push(new Cue(totalTime, step.name, step.duration));

        // Increase the time
        totalTime += step.duration;
      }
    }
  }

  console.log(cues);
}

let start;
let prevIndex = -1;
function step(timestamp)
{
  if (start === undefined)
  {
    start = timestamp;
  }
  const elapsed = (timestamp - start) / 1000; // Seconds

  // Iterate over the array to see which index the time falls into
  // If it's different from the previous run, say the new message
  for (let i = 0; i < cues.length; ++i)
  {
    let cue = cues[i];

    if ((cue.time <= elapsed) && (cue.time + cue.duration > elapsed))
    {
      if (prevIndex != i)
      {
        if (cue.isExercise)
        {
          ui.currentExercise.textContent = cue.message;
        }

        var msg = new SpeechSynthesisUtterance(cue.message);
        msg.rate = 2.0;
        window.speechSynthesis.speak(msg);

        console.log(elapsed);
      }

      prevIndex = i;
    }
  }

  window.requestAnimationFrame(step);
}
