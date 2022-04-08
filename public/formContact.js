function submitData() {
    let name = document.getElementById("input-name").value
    let email = document.getElementById("input-email").value
    let number = document.getElementById("input-number").value
    let subject = document.getElementById("input-subject").value
    let message = document.getElementById("input-message").value

    // console.log(name);
    // console.log(email);
    // console.log(number);
    // console.log(subject);
    // console.log(message);

    if (name == "") {
        return alert("Nama wajib diisi")
    } else if (email == "") {
        return alert("Email wajib diisi")
    } else if (number == "") {
        return alert("Phone Number wajib diisi")
    } else if (subject == "") {
        return alert("Subject wajib diisi")
    } else if (message == "") {
        return alert("Message wajib diisi")
    }

    let emailReceiver = "mgmrz77@gmail.com"
    let a = document.createElement("a") //Pembuatan tag anchor
    a.href = `mailto:${emailReceiver}?subject=${subject}&body=Hallo, My name ${name} - ${email}, my Phone Number is ${number}. Message: ${message}`
    a.click() //menjalankan tag anchor atau mengklik tag anchor

    let dataObject = {
        name: name,
        email: email,
        phone: number,
        subject: subject,
        message: message
    }
    console.log(dataObject);

}

