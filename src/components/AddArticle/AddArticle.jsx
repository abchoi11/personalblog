import { collection, Timestamp, addDoc } from "firebase/firestore";
import React, { useState } from "react";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage, db, auth } from "./../../firebase-config";
import "./AddArticle.css";
import { toast } from "react-toastify";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate, useNavigation } from "react-router-dom";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import parse from "html-react-parser";

function AddArticle(props) {
  const [user] = useAuthState(auth);
  let navigate = useNavigate();

  const [text, setText] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    createdAt: Timestamp.now().toDate(),
    body: "",
  });

  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description || !formData.image) {
      alert("Please fill all the fields");
      return;
    }

    const storageRef = ref(
      storage,
      `/images/${Date.now()}${formData.image.name}`
    );
    const uploadImage = uploadBytesResumable(storageRef, formData.image);

    uploadImage.on(
      "state_changed",
      (snapshot) => {
        const currentPercent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(currentPercent);
      },
      (err) => {
        console.log(err);
      },
      () => {
        setFormData({
          title: "",
          description: "",
          image: "",
          body: "",
        });
        getDownloadURL(uploadImage.snapshot.ref).then((url) => {
          navigate("/");
          const articleRef = collection(db, "Articles");
          addDoc(articleRef, {
            title: formData.title,
            description: formData.description,
            imageURL: url,
            createdAt: Timestamp.now().toDate(),
            createdBy: user.displayName,
            userId: user.uid,
            likes: [],
            comments: [],
            body: text,
          })
            .then(() => {
              toast("Article added successfully", { type: "success" });
              setProgress(0);
            })
            .catch((err) => {
              toast("Error adding article", { type: "error" });
            });
        });
      }
    );
  };

  const ckeEditor = (
    <div className="editor">
      <CKEditor
        className=""
        editor={ClassicEditor}
        data={text}
        value={text}
        onChange={(event, editor) => {
          const data = editor.getData();
          setText(data);
        }}
      />
    </div>
  );

  return (
    <div className="articleAdd ">
      {!user ? (
        <>
          <div style={{ maxWidth: 400 }}>
            <h2>
              {" "}
              <Link to="/login">Login to Create an Article</Link>
            </h2>
            Don't have an account?
            <Link to="/register"> Sign Up </Link>
          </div>
        </>
      ) : (
        <>
          {" "}
          <h2 className="addArticleHeader">Create an Article</h2>
          <div className="form-group">
            <input
              type="text"
              name="title"
              className="form-control title-form"
              value={formData.title}
              placeholder="Title . . ."
              onChange={(e) => handleChange(e)}
            />
          </div>
          <br></br>
          <input
            type="text"
            name="description"
            placeholder="Description . . ."
            className="form-control description-form"
            value={formData.description}
            onChange={(e) => handleChange(e)}
          />
          <label className="imageLabel" htmlFor="">Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="form-control image-form"
            onChange={(e) => handleImageChange(e)}
          />
          <br></br>
          {ckeEditor}
          {progress === 0 ? null : (
            <div className="progress">
              <div
                className="progress-bar progress-bar-striped mt-2"
                style={{ width: `${progress}%` }}
              >
                {`uploading image ${progress}%`}
              </div>
            </div>
          )}
          <button
            className="form-control submit"
            onClick={handleSubmit}
          >
            Publish
          </button>
        </>
      )}
    </div>
  );
}

export default AddArticle;
