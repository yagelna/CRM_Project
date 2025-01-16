const Login = () => {
    return (
        <div>
            <div class="card text-center shadow-lg">
                <div class="card-body">
                    <form>
                        <h1 class="h3 mb-3 fw-normal">Please sign in</h1>

                        <div class="form-floating">
                        <input type="email" class="form-control" id="floatingInput" placeholder="name@example.com" />
                        <label for="floatingInput">Email address</label>
                        </div>
                        <div class="form-floating">
                        <input type="password" class="form-control" id="floatingPassword" placeholder="Password" />
                        <label for="floatingPassword">Password</label>
                        </div>

                        <div class="form-check text-start my-3">
                        <input class="form-check-input" type="checkbox" value="remember-me" id="flexCheckDefault" />
                        <label class="form-check-label" for="flexCheckDefault">
                            Remember me
                        </label>
                        </div>
                        <button class="btn btn-primary w-100 py-2" type="submit">Sign in</button>
                    </form>


                </div>
                <div class="card-footer text-body-secondary">
                Don't have an account? <a href="/register">Create One</a>
                </div>
            </div>
        </div>
    );
}

export default Login;