const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cellsH = 14;
const cellsV = 13;

const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsH;
const unitLengthY = height / cellsV;

const engine = Engine.create();
engine.world.gravity.y = 0;

const { world } = engine;
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

//walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];

World.add(world, walls);

//Maze generation

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }
  return arr;
};

//creation grid, vert, horiz

const grid = Array(cellsV)
  .fill(null)
  .map(() => Array(cellsH).fill(false));

const verticals = Array(cellsV)
  .fill(null)
  .map(() => Array(cellsH - 1).fill(false));

const horizontals = Array(cellsV - 1)
  .fill(null)
  .map(() => Array(cellsH).fill(false));

const startRow = Math.floor(Math.random() * cellsV);
const startColumn = Math.floor(Math.random() * cellsH);

const stepThrCell = (row, column) => {
  //if i've visited the cell at [row, column], return
  if (grid[row][column]) {
    return;
  }
  //Mark cell as visited

  grid[row][column] = true;

  //Assemble randm list of neighbors

  const neighbors = shuffle([
    [row - 1, column, "up"],
    [row, column + 1, "right"],
    [row + 1, column, "down"],
    [row, column - 1, "left"],
  ]);

  //for each neighbor...
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;
    //see if out of bonds
    if (
      nextRow < 0 ||
      nextRow >= cellsV ||
      nextColumn < 0 ||
      nextColumn >= cellsH
    ) {
      continue;
    }

    //see if visited, continue to next
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    //remove wall from horiz or vert
    if (direction === "left") {
      verticals[row][column - 1] = true;
    } else if (direction === "right") {
      verticals[row][column] = true;
    } else if (direction === "up") {
      horizontals[row - 1][column] = true;
    } else if (direction === "down") {
      horizontals[row][column] = true;
    }
    stepThrCell(nextRow, nextColumn);
  }

  //visit that cell
};

stepThrCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      10,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "pink",
        },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      10,
      unitLengthY,
      {
        label: "wall",
        isStatic: true,
        render: {
          fillStyle: "pink",
        },
      }
    );
    World.add(world, wall);
  });
});

//goal
const goal = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.5,
  unitLengthY * 0.5,
  {
    label: "goal",
    isStatic: true,
    render: {
      fillStyle: "lightgreen",
    },
  }
);
World.add(world, goal);

//ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
  label: "ball",
  render: { fillStyle: "lightblue" },
});
World.add(world, ball);

//move ball
document.addEventListener("keydown", (event) => {
  const { x, y } = ball.velocity;

  if (event.key === "w" || event.key === "ArrowUp") {
    Body.setVelocity(ball, { x, y: y - 2 });
  }
  if (event.key === "s" || event.key === "ArrowDown") {
    Body.setVelocity(ball, { x, y: y + 2 });
  }
  if (event.key === "a" || event.key === "ArrowLeft") {
    Body.setVelocity(ball, { x: x - 2, y });
  }
  if (event.key === "d" || event.key === "ArrowRight") {
    Body.setVelocity(ball, { x: x + 2, y });
  }
});

//stop moving
/*
document.addEventListener("keyup", (event) => {
  const { x, y } = ball.velocity;
  Body.setVelocity(ball, { x: 0, y: 0 });
});
*/

//win condition

Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const labels = ["ball", "goal"];
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector(".winner").classList.remove("hidden");
      document.querySelector("body").classList.add("win");
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === "wall") {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
