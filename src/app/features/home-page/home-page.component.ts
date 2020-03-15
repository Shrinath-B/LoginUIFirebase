import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";

import { AuthService } from "../auth/auth.service";

import {
  AngularFirestore,
  AngularFirestoreCollection,
  AngularFirestoreDocument
} from "@angular/fire/firestore";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";

@Component({
  selector: "app-home-page",
  templateUrl: "./home-page.component.html",
  styleUrls: ["./home-page.component.scss"]
})
export class HomePageComponent implements OnInit {
  loginForm: FormGroup;
  loginFail: boolean;

  existingUserDetails = [];

  postsCol: AngularFirestoreCollection<any>;
  posts: any;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private afs: AngularFirestore
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl("dashboard");
    }
  }

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ["", Validators.required],
      password: ["", Validators.required]
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

  getLoginFormControls(controlName?: string) {
    return this.loginForm.controls[controlName];
  }

  onLogin() {
    this.loginFail = false;
    if (this.loginForm.valid) {
      this.postsCol = this.afs.collection("userDetails", ref =>
        ref.where("userName", "==", this.getLoginFormControls("username").value)
      );
      this.posts = this.postsCol.snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, data };
          });
        })
      );
      this.posts.subscribe(userDetail => {
        if (userDetail && userDetail.length) {
          userDetail[0].data.password ===
          this.getLoginFormControls("password").value
            ? this.loginSuccess()
            : this.invalidLogin();
        } else {
          this.invalidLogin();
        }
      });
    } else {
      this.setErrors("username");
      this.setErrors("password");
    }
  }

  loginSuccess() {
    this.router.navigateByUrl("dashboard");
  }

  invalidLogin() {
    this.loginFail = true;
    this.loginForm.reset();
  }

  /* onLogin() {
    this.loginFail = false;
    if (this.loginForm.valid) {
      this.authService
        .login(
          this.getLoginFormControls("username").value,
          this.getLoginFormControls("password").value
        )
        .subscribe(
          (data: any) => {
            console.log(data);
            this.router.navigateByUrl("dashboard");
          },
          error => {
            this.loginFail = true;
            this.loginForm.reset();
          },
          () => {}
        );
    } else {
      this.setErrors("username");
      this.setErrors("password");
    }
  } */

  setErrors(controlName: string) {
    if (!this.getLoginFormControls(controlName).value) {
      this.getLoginFormControls(controlName).markAsTouched();
      this.getLoginFormControls(controlName).setErrors({ required: true });
    }
  }
}
