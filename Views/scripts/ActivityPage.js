// Fetch the database from SQL server.
document.addEventListener("DOMContentLoaded", function (id) {
  // Chained fetches (ugh!).
  // First, fetch a request to get one user based on their user ID (globalized).
  fetch("http://localhost:8080/users/"+sessionStorage.getItem("GlobalUserID"), {
    headers: {
      "Content-Type": "application/json",
    },
  })
    // User's data is returned in JSON format.
    .then(function (userRes) {
      if (!userRes.ok) {
        throw new Error("Failed to fetch user");
      }
      return userRes.json();
    })
    .then(function (userData) {
      // Next, fetch a request to get the TracksActivities table with the fetched user ID from before.
      return fetch(`http://localhost:8080/tracksactivities/${userData.UserID}`);
    })
    // A table of the fetched user's activities data is returned in JSON format.
    .then(function (activitiesRes) {
      if (!activitiesRes.ok) {
        throw new Error("Failed to fetch activities");
      }
      return activitiesRes.json();
    })
    // Since activities data is in an array, each activity must be isolated from the array using the map() function to iterate through the activities.
    // Then, each activity ID sends a fetch request to receive each
    .then(function (activitiesData) {
      // This requires iteration with map() to go through all the data.
      const activityIDs = activitiesData.map((activity) => activity.ActivityID);
      const activityFetchPromises = activityIDs.map((activityID) =>
        fetch(`http://localhost:8080/activities/${activityID}`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
      );

      // Promise.all() ensures that all the iterated fetched activities are returned as a single Promise.
      // Having multiple Promises returned may cause errors to the fetch chain (though I'm not exactly sure what errors would arise).
      return Promise.all(activityFetchPromises);
    })
    // Another iteration/map is required to convert all the activities in the table to JSON format.
    .then(function (activityResponses) {
      const activityJSONPromises = activityResponses.map((response) =>
        response.json()
      );

      // The activities in JSON format all get returned as a single Promise.
      return Promise.all(activityJSONPromises);
    })
    .then(function (activityJSONs) {
      console.log(activityJSONs);
      // Function loadTable() is called to start loading the table from the database.
      loadTable(activityJSONs);
    })
    // Any errors in the fetch chain are caught below.
    .catch(function (error) {
      console.error("Error:", error);
    });
});

const addButton = document.querySelector("#addEntryButton");

// JavaScript to handle adding entries to the table
addButton.onclick = () => {
  var name = prompt("Enter activity:");
  var duration = prompt("Enter duration in minutes:");
  var calories = prompt("Enter calories burned:");

  if (name && duration && calories) {
    fetch("http://localhost:8080/createactivities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-cache",
      body: JSON.stringify({
        ActivityName: name,
        DurationTime: duration,
        TotalCaloriesBurnt: calories,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      })
      .catch((err) => console.log(err));
    location.reload();
  } else {
    alert("Please enter valid values for all fields.");
  }
};

document.querySelector("table tbody").addEventListener("click", function (event) {
    if (event.target.className === "delete-btn") {
      var rowID = event.target.dataset.id;
      deleteRowById(rowID);
    }
    if (event.target.className === "edit-btn") {
      var rowID = event.target.dataset.id;
      editRowById(rowID);
    }
  });

// Row can be deleted once "Delete" button is pressed.
function deleteRowById(id) {
  // Send a fetch request with the activity ID argument.
  fetch(`http://localhost:8080/deleteactivities/${id}`, {
    method: "DELETE",
  })
    .then(function (res) {
      if (!res.ok) throw new Error("Failed to delete row.");
      // Current webpage reloads once the row is deleted from the database table.
      location.reload();
    })
    .catch((error) => console.error("Failed to delete row."));
}

// Row can have its values edited once "Edit" button is pressed.
function editRowById(id) {
  // Prompts are similar to the function to add rows.
  var name = prompt("Enter activity:");
  var duration = prompt("Enter duration in minutes:");
  var calories = prompt("Enter calories burned:");

  if (name && duration && calories) {
    fetch(`http://localhost:8080/updateactivities/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ActivityName: name,
        DurationTime: duration,
        TotalCaloriesBurnt: calories,
        ActivityID: id,
      }),
      cache: "no-cache",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update row.");
        return res.json();
      })
      .then((data) => {
        location.reload();
      })
      .catch((error) => console.error("Failed to update row."));
  } else {
    alert("Please enter valid values for all fields.");
  }
}

// Load the database table into HTML file.
function loadTable(data) {
  console.log("Loading table from database...");
  console.log(data);

  // Variable table will hold the table loaded from the database.
  let table = document.querySelector("table tbody");

  // Variable tableHTML will load the HTML contents to table.innerHTML.
  let tableHTML = "";

  // Each row of the database table is outputted through the iteration below [forEach()].
  data.forEach(function ({
    ActivityID,
    ActivityName,
    DurationTime,
    TotalCaloriesBurnt,
  }) {
    tableHTML += "<tr>";
    tableHTML += `<td id="name-col">${ActivityName}</td>`;
    tableHTML += `<td id="dur-col">${DurationTime}</td>`;
    tableHTML += `<td id="cal-col">${TotalCaloriesBurnt}</td>`;
    tableHTML += `<td><button class="delete-btn" data-id=${ActivityID}>Delete</td>`;
    tableHTML += `<td><button class="edit-btn" data-id=${ActivityID}>Edit</td>`;
    tableHTML += "</tr>";
  });

  table.innerHTML = tableHTML;
}
