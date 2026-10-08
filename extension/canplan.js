const asu_canvas = "https://canvas.asu.edu";

browser.action.onClicked.addListener(async (tab) => {
  if (tab.url?.startsWith(asu_canvas)) {
    browser.action.setBadgeText({
      text: "ASU",
    });
    console.log("CanPlan: ASU Canvas Found");

    const courses = await fetch(
      `${asu_canvas}/api/v1/courses?per_page=100&include[]=term`,
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `CanPlan: Error fetching courses (status ${response.status})`,
          );
        }
        return response.json();
      })
      .then((json) => {
        const term_ids = json.map((item) => item.term?.id ?? 0);
        const max_term_id = Math.max(...term_ids);
        const cur_term_courses = json.filter(
          (item) => item.term?.id === max_term_id,
        );

        return cur_term_courses;
      });

    var assignments = [];
    var promises = [];
    for (const course of courses) {
      const assignments_url = `${asu_canvas}/api/v1/courses/${course.id}/assignments?per_page=100`;

      promises.push(
        fetch(assignments_url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `CanPlan: Error fetching assignments (status ${response.status})`,
              );
            }
            return response.json();
          })
          .then((json) => {
            console.log(json);
            for (const assignment of json) {
              assignments.push({
                name: assignment.name,
                due_at: assignment.due_at,
                html_url: assignment.html_url,
                availability_status: assignment.availability_status,
                course_id: assignment.course_id,
                course_name: course.name,
                submitted: assignment.has_submitted_submissions,
              });
            }
          }),
      );
    }
    await Promise.all(promises);
    assignments = assignments.filter(
      (a) =>
        a.due_at &&
        a.submitted == false &&
        a.availability_status?.status != "closed",
    );
    assignments.sort((a, b) => a.due_at.localeCompare(b.due_at));
    console.log(assignments);
  } else {
    browser.action.setBadgeText({
      text: "?",
    });
    console.log("CanPlan: Unknown Website!");
  }
});
