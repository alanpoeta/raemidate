export const desnakify = text => {
    if (!text) return text;
    text = text.replace(/_/g, " ");
    return text[0].toUpperCase() + text.slice(1);
};

export const setServerErrors = (error, setError) => {
    const errors = error.response?.data;
      if (!errors) {
        setError("root", { type: "server", message: "An unexpected error occurred."});
        return;
      }
      for (const field in errors) {
        if (typeof errors[field] === "object") {
          setError("root", { type: "server", message: errors[field].join(' ')});
        } else if (typeof errors[field] === "string") {
          setError("root", { type: "server", message: errors[field]});
        }
      }
};

export const requiredErrorMessage = (field) => {
    return `${desnakify(field)} is required.`
};
