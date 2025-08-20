export const desnakify = text => {
    text = text.replace(/_/g, " ");
    return text[0].toUpperCase() + text.slice(1);
};

export const setServerErrors = (error, setError) => {
    const errors = error.response?.data;
      if (!errors) {
        setError("root", { type: "server", message: "An unexpected error occurred."});
        return;
      }
      console.log(errors)
      for (const field in errors) {
        setError("root", { type: "server", message: errors[field].join(' ')});
      }
}

export const requiredErrorMessage = (field) => {
    return `${desnakify(field)} is required.`
}
