// StudentsHome.js
const StudentsHome = ({ onWhiteboardClick }) => {
    return (
      <div>
        <h1>Welcome, Student!</h1>
        <button onClick={onWhiteboardClick}>Go to Whiteboard</button>
      </div>
    );
  };
  
  export default StudentsHome;
  