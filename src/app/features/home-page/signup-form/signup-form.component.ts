import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";

import {
  phoneNumberValidator,
  passwordValidator,
  usernameValidator
} from "../../../shared/validators/signup-validators";

import {
  AngularFirestore,
  AngularFirestoreCollection
} from "@angular/fire/firestore";
import { map } from "rxjs/operators";

@Component({
  selector: "app-signup-form",
  templateUrl: "./signup-form.component.html",
  styleUrls: ["./signup-form.component.scss"]
})
export class SignupFormComponent implements OnInit {
  registerForm: FormGroup;
  existingUserDetails = [];

  postsCol: AngularFirestoreCollection<any>;
  posts: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private afs: AngularFirestore
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      userName: ["", [Validators.required, usernameValidator]],
      gender: ["", Validators.required],
      dob: ["", Validators.required],
      phoneNumber: ["", [Validators.required, phoneNumberValidator]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, passwordValidator]],
      rePassword: ["", Validators.required]
    });
    this.postsCol = this.afs.collection("userDetails");
    this.posts = this.postsCol.snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, data };
        });
      })
    );
    this.posts.subscribe(a => {
      if (a && a.length) {
        this.existingUserDetails = a;
      }
    });
  }

  getRegisterFormControls(controlName?: string) {
    return this.registerForm.controls[controlName];
  }

  onRegister() {
    if (this.registerForm.valid) {
      const dateOfBirth = this.getRegisterFormControls("dob").value;
      const signupRequest = {
        firstName: this.getRegisterFormControls("firstName").value,
        lastName: this.getRegisterFormControls("lastName").value,
        userName: this.getRegisterFormControls("userName").value,
        gender: this.getRegisterFormControls("gender").value,
        dob: `${dateOfBirth.day}/${dateOfBirth.month}/${dateOfBirth.year}`,
        phoneNumber: Number(this.getRegisterFormControls("phoneNumber").value),
        email: this.getRegisterFormControls("email").value,
        password: this.getRegisterFormControls("password").value,
        confirmPassword: this.getRegisterFormControls("rePassword").value
      };
      if (signupRequest.confirmPassword !== signupRequest.password) {
        this.getRegisterFormControls("rePassword").setErrors({
          mismatch: true
        });
        return;
      }

      const usernameInvalid = this.existingUserDetails.find(
        item => item.id === signupRequest.userName
      );
      const emailInvalid = this.existingUserDetails.find(
        item => item.data.email === signupRequest.email
      );

      if (usernameInvalid) {
        this.getRegisterFormControls("userName").setErrors({
          exist: true
        });
      } else if (emailInvalid) {
        this.getRegisterFormControls("email").setErrors({ exist: true });
      } else {
        this.afs
          .collection("userDetails")
          .doc(signupRequest.userName)
          .set(signupRequest);
        this.router.navigateByUrl("/login");
      }
    } else {
      const formControls = Object.keys(this.registerForm.controls);
      formControls.map(item => this.setErrors(item));
    }
  }

  setErrors(controlName: string) {
    if (!this.getRegisterFormControls(controlName).value) {
      this.getRegisterFormControls(controlName).markAsTouched();
      this.getRegisterFormControls(controlName).setErrors({ required: true });
    }
  }

  getMaxDate() {
    const today = new Date();
    const minYear = new Date();
    minYear.setFullYear(today.getFullYear() - 18);
    return {
      year: minYear.getFullYear(),
      month: minYear.getMonth(),
      day: minYear.getDate()
    };
  }
}
