import { HTMLContainer, ShapeUtil } from "tldraw";

export default class LikeShapeUtil extends ShapeUtil {
  static type = "like";

  getDefaultProps() {
    return {
      w: 50,
      h: 50,
      text: "👍",
    };
  }

  getGeometry(shape) {
    return {
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    };
  }

  component(shape) {
    return (
      <HTMLContainer>
        <div
          style={{
            width: shape.props.w,
            height: shape.props.h,
            background: "linear-gradient(135deg, #e66465, #9198e5)",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "28px",
            fontWeight: "bold",
            color: "#fff",
            borderRadius: "50%",
            border: "2px solid #333",
            padding: "8px",
            transition: "transform 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {shape.props.text}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
