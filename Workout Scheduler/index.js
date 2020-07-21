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

class ExerciseRef
{
  constructor(exerciseIdx, reps)
  {
    this.exerciseIdx = exerciseIdx;
    this.reps = reps;
  }
}

class ExerciseSet
{
  constructor(name, exercises = [], reps)
  {
    this.name = name;
    this.exercises = exercises;
    this.reps = reps;
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
  constructor(setIdx, reps)
  {
    this.setIdx = setIdx;
    this.reps = reps;
  }
}

function GetExerciseIdxFromName(exercises, name)
{
  for (let e = 0; e < exercises.length; ++e)
  {
    if (exercises[e].name == name)
    {
      return e;
    }
  }

  console.error("No exercise found called ", name);
  return -1;
}

function GetSetIdxFromName(sets, name)
{
  for (let e = 0; e < sets.length; ++e)
  {
    if (sets[e].name == name)
    {
      return e;
    }
  }

  console.error("No set found called ", name);
  return -1;
}

class Workout
{
  constructor(exercises = [], sets = [], schedule = [])
  {
    this.exercises = exercises;
    this.sets = sets;
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

    // Parse sets
    let sets = data.sets;
    for (let s of sets)
    {
      let set = new ExerciseSet();

      set.name = s.name;

      // Parse exercises
      for (let e of s.exercises)
      {
        set.exercises.push(new ExerciseRef(GetExerciseIdxFromName(this.exercises, e.exercise), e.reps));
      }

      set.reps = s.reps;

      this.sets.push(set);
    }

    // Parse schedule
    let schedule = data.schedule;
    for (let s of schedule)
    {
      // Find setIdx from name
      let setIdx = GetSetIdxFromName(this.sets, s.set);

      let schedule = new Schedule(setIdx, s.reps);

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
  for (let sch of workout.schedule)
  {
    // Get the set
    let set = workout.sets[sch.setIdx];

    // For every rep of the set
    for (let i = 0; i < set.reps; ++i)
    {
      // For every exercise in the set
      for (let s of set.exercises)
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
