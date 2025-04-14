
    window.onload = function() {
        const user = JSON.parse(localStorage.getItem("user"));

       

        // Display Name, Role, and College
        document.getElementById("userName").innerText = user.Name;
        document.getElementById("userRole").innerText = user.Role;
        document.getElementById("userCollege").innerText = user.College;

        // Fetch the user data from the external JSON file
        fetch('https://raw.githubusercontent.com/seeditDev/SEEDDB/main/userPassword.json')
            .then(response => response.json())
            .then(data => {
                // Filter data based on the user's college
                const filteredStudents = data.filter(student => student.College === user.College);

                // Save filtered data in a variable for easy reset
                let allStudents = [...filteredStudents]; // Copy of the initial filtered data

                const studentTableBody = document.querySelector('tbody');
                studentTableBody.innerHTML = ''; // Clear any previous data

                // Function to render student data
                function renderStudents(students) {
                    studentTableBody.innerHTML = ''; // Clear any previous data
                    students.forEach(student => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${student.Name}</td>
                            <td>${student.Email}</td>
                            <td>${student['Roll Number']}</td>
                            <td>${student.Department}</td>
                            <td>${student.Year}</td>
                            <td>${student.BasicDataTypesScore}</td>
                            <td>${student.ConditionalStatementsScore}</td>
                            <td>${student.LoopingScore}</td>
                            <td>${student.PatternsScore}</td>
                            <td>${student.NumberCrunchingScore}</td>
                            <td>${student.NumberProblemsScore}</td>
                            <td>${student.ArraysScore}</td>
                            <td>${student.StringsScore}</td>
                            <td>${student.FunctionsScore}</td>
                            <td>${student.StructuresScore}</td>
                        `;
                        studentTableBody.appendChild(row);
                    });
                }

                // Initially display all filtered students
                renderStudents(filteredStudents);

                // Filtering function for Department and Year
                document.getElementById("filterButton").addEventListener("click", function() {
                    const department = document.getElementById("departmentSelect").value;
                    const year = document.getElementById("yearSelect").value;

                    const filteredByDepartmentAndYear = filteredStudents.filter(student => {
                        const matchesDepartment = department ? student.Department.toLowerCase() === department.toLowerCase() : true;
                        const matchesYear = year ? student.Year.toLowerCase() === year.toLowerCase() : true;
                        return matchesDepartment && matchesYear;
                    });

                    renderStudents(filteredByDepartmentAndYear);
                });

                // Reset function to show all data
                document.getElementById("resetButton").addEventListener("click", function() {
                    renderStudents(filteredStudents); // Reset to the original filtered data
                });

            })
            .catch(error => console.error('Error fetching data:', error));
    };
	
	// Function to export table data to Excel
function exportToExcel() {
    const table = document.getElementById("studentTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Student Data" });
    XLSX.writeFile(wb, "student_data.xlsx");
}


document.getElementById("exportExcel").addEventListener("click", function() {
    exportToExcel();
});


    // Logout function
    window.logout = function() {
        localStorage.removeItem("user");
      
       window.location.href = "https://www.seedit.rf.gd/login";
    };

    // Function to handle download for Windows
    function downloadForWindows() {
        window.open("https://drive.google.com/uc?export=download&id=1_Kaz-5ksmdFfxcLtlONusepOMYT8GM4s", "_blank");
    }

    // Attach event listeners for buttons
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('downloadBtn').addEventListener('click', downloadForWindows);